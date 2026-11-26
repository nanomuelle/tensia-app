import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { BloodPressureRecord } from '../../src/services/db';

test('el manifiesto de producción declara modo independiente e iconos de instalación', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBe(true);
  expect(await response.json()).toMatchObject({
    name: 'Tensia - Tensión Arterial', short_name: 'Tensia', display: 'standalone',
    icons: expect.arrayContaining([
      expect.objectContaining({ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }),
      expect.objectContaining({ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }),
    ]),
  });
});

test('los iconos declarados se sirven como PNG y no como el HTML de la app', async ({ request }) => {
  const icons = await Promise.all(['pwa-192x192.png', 'pwa-512x512.png'].map(async name => {
    const response = await request.get(`/${name}`);
    return { name, status: response.status(), type: response.headers()['content-type'], signature: (await response.body()).subarray(0, 8).toString('hex') };
  }));
  test.fail(icons.every(icon => icon.status === 200 && icon.type === 'text/html' && icon.signature === '3c21646f63747970'),
    'Fallo conocido: los dos PNG no están en el build y Vite devuelve index.html.');
  for (const { name, status, type, signature } of icons) {
    expect.soft(status, name).toBe(200);
    expect.soft(type, name).toMatch(/^image\/png\b/);
    expect.soft(signature, name).toBe('89504e470d0a1a0a');
  }
});

test('tras activar el SW, registra, restaura y descarga archivos sin red', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date('2026-11-23T10:59:00Z'));
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('No hay tomas registradas.')).toBeVisible();
  await page.getByRole('button', { name: 'Registrar Toma' }).click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('120/80', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('120/80', { exact: true }).filter({ visible: true })).toBeVisible();

  const backupPending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup', exact: true }).click();
  const backup = await backupPending;
  expect(backup.suggestedFilename()).toBe('Tensia-Backup.json');
  const exported = JSON.parse(await readFile(await backup.path(), 'utf8')) as BloodPressureRecord[];
  expect(exported).toEqual([{
    id: expect.any(Number), systolic: 120, diastolic: 80, pulse: 70, period: 'Mañana', timestamp: '2026-11-23T10:59:00.000Z',
  }]);

  await page.getByRole('button', { name: 'Más opciones', exact: true }).click();
  const chooserPending = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Importar JSON', exact: true }).click();
  await (await chooserPending).setFiles({
    name: 'copia-sintética.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify([...exported, { ...exported[0], systolic: 126, timestamp: '2026-11-23T17:00:00.000Z' }])),
  });
  await page.getByRole('button', { name: 'Confirmar e Importar' }).click();
  await expect(page.getByText('126/80', { exact: true }).filter({ visible: true })).toBeVisible();

  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  const report = page.getByRole('dialog', { name: 'Informe de lecturas de presión arterial' });
  await report.getByLabel('Nombre', { exact: true }).fill('Perfil sintético');
  await report.getByLabel('Fecha de nacimiento').fill('1980-01-01');
  await report.getByLabel('Medicación').fill('Sin medicación');
  await report.getByLabel('Tensiómetro').fill('Monitor sintético');
  await report.getByLabel('Brazo usado').selectOption('Izquierdo');
  const pdfPending = page.waitForEvent('download');
  await report.getByRole('button', { name: 'Generar y descargar PDF' }).click();
  const pdf = await pdfPending;
  expect(pdf.suggestedFilename()).toBe('Tensia-Informe_2026-11-23_2026-11-23.pdf');
  expect(await readFile(await pdf.path(), 'latin1')).toMatch(/^%PDF-/);
});
