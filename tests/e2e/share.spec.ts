import { expect, test } from '@playwright/test';
import { seedReadings } from './helpers/indexedDb';
import type { BloodPressureRecord } from '../../src/services/db';

test.use({ locale: 'es-ES' });

const readings: BloodPressureRecord[] = [
  { systolic: 134, timestamp: '2026-11-23T23:05:00.000Z', period: 'Noche' },
  { systolic: 133, timestamp: '2026-11-23T12:00:00.000Z', period: 'Tarde' },
  { systolic: 130, timestamp: '2026-11-21T08:00:00.000Z', period: 'Mañana' },
  { systolic: 132, timestamp: '2026-11-23T08:00:00.000Z', period: 'Mañana' },
  { systolic: 129, timestamp: '2026-11-20T10:00:00.000Z', period: 'Mañana' },
  { systolic: 131, timestamp: '2026-11-22T19:00:00.000Z', period: 'Noche' },
].map(row => ({ ...row, period: row.period as BloodPressureRecord['period'], diastolic: 81, pulse: 64, notes: 'Nota privada sintética' }));

const summary = [
  'Tensión Arterial (Tensia):',
  '24/11/2026 (Noche): 134/81 mmHg',
  '23/11/2026 (Tarde): 133/81 mmHg',
  '23/11/2026 (Mañana): 132/81 mmHg',
  '22/11/2026 (Noche): 131/81 mmHg',
  '21/11/2026 (Mañana): 130/81 mmHg',
].join('\n');

test('los dos accesos comparten solo las cinco últimas tomas y usan fechas locales', async ({ page }) => {
  const payloads: ShareData[] = [];
  await page.exposeFunction('captureShare', (payload: ShareData) => { payloads.push(payload); });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value(this: Navigator, payload: ShareData) {
      if (this !== navigator) throw new Error('Web Share requiere navigator como receptor');
      return (window as unknown as { captureShare: (data: ShareData) => Promise<void> }).captureShare(payload);
    } });
  });
  await page.goto('/');
  await seedReadings(page, readings);
  await page.reload();
  await page.getByRole('button', { name: 'Compartir', exact: true }).click();
  await expect.poll(() => payloads).toEqual([{ title: 'Tensia', text: summary }]);
  await page.getByRole('button', { name: 'Más opciones', exact: true }).click();
  await page.getByRole('button', { name: 'Compartir Historial', exact: true }).click();
  await expect.poll(() => payloads).toEqual([{ title: 'Tensia', text: summary }, { title: 'Tensia', text: summary }]);
  await expect(page.getByRole('button', { name: 'Compartir Historial' })).toBeHidden();
});

test('sin tomas bloquea PDF, Compartir y Backup, pero permite importar y abrir AMPA desde el menú', async ({ page }) => {
  await page.goto('/');
  const shortcuts = page.getByRole('group', { name: 'Accesos directos' });
  for (const name of ['PDF', 'Compartir', 'Backup']) {
    await expect(shortcuts.getByRole('button', { name, exact: true })).toBeDisabled();
  }
  const more = page.getByRole('button', { name: 'Más opciones', exact: true });
  await more.click();
  for (const name of ['Exportar PDF', 'Compartir Historial', 'Backup (Exportar JSON)']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeDisabled();
  }
  const importButton = page.getByRole('button', { name: 'Importar JSON', exact: true });
  await expect(importButton).toBeEnabled();
  await page.getByRole('heading', { name: 'Historial', exact: true }).click();
  await expect(importButton).toBeHidden();
  await more.click();
  await page.getByRole('button', { name: 'Informe semanal AMPA' }).click();
  const dialog = page.getByRole('dialog', { name: 'Informe semanal AMPA' });
  await expect(dialog.getByText('No hay lecturas para las franjas seleccionadas.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Generar y descargar PDF' })).toBeDisabled();
});
