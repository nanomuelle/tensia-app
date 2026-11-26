import { expect, test } from '@playwright/test';
import { readStoredReadings, seedReadings } from './helpers/indexedDb';
import type { BloodPressureRecord } from '../../src/services/db';

const reading: BloodPressureRecord = {
  id: 9, systolic: 135, diastolic: 85, pulse: 70, period: 'Mañana', timestamp: '2026-11-23T08:00:00.000Z',
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await seedReadings(page, [reading]);
  await page.reload();
});

test('un perfil local ilegible muestra un aviso sin cambiar las tomas', async ({ page }) => {
  await page.evaluate(async moduleUrl => {
    const { db } = await import(moduleUrl) as typeof import('../../src/services/db');
    await db.settings.put({ key: 'ampa_report_profile', value: '{' });
  }, '/src/services/db.ts');
  await page.getByRole('button', { name: 'Registro AMPA', exact: true }).click();
  const report = page.getByRole('dialog', { name: 'Informe semanal AMPA' });
  await expect(report.getByText('No se pudieron cargar los datos guardados.')).toBeVisible();
  await expect(report.getByLabel('Nombre', { exact: true })).toHaveValue('');
  await report.getByRole('button', { name: 'Cerrar' }).click();
  await expect(report).toBeHidden();
  expect(await readStoredReadings(page)).toEqual([reading]);
});

test('avisa si no puede guardar las preferencias y permite cerrar el informe', async ({ page }) => {
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      if (this.name === 'settings' && args[0]?.key === 'ampa_report_profile') {
        throw new DOMException('Fallo de escritura simulado', 'QuotaExceededError');
      }
      return put.apply(this, args);
    };
  });
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  const report = page.getByRole('dialog', { name: 'Informe de lecturas de presión arterial' });
  await report.getByLabel('Nombre', { exact: true }).fill('Perfil sintético');
  await expect(report.getByRole('alert')).toHaveText('No se pudieron guardar las preferencias del informe.');
  await report.getByRole('button', { name: 'Cerrar' }).click();
  await expect(report).toBeHidden();
  await page.reload();
  expect(await readStoredReadings(page)).toEqual([reading]);
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  await expect(report.getByLabel('Nombre', { exact: true })).toBeEnabled();
  await expect(report.getByLabel('Nombre', { exact: true })).toHaveValue('');
});
