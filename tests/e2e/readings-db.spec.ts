import { expect, test } from '@playwright/test';
import { readStoredReadings, seedReadings } from './helpers/indexedDb';
import type { BloodPressureRecord } from '../../src/services/db';

test('actualiza la base v1 sin cambiar las tomas y permite guardar ajustes en v2', async ({ page }) => {
  const original: BloodPressureRecord = {
    id: 17, systolic: 133, diastolic: 81, pulse: 64, timestamp: '2026-11-23T08:00:00.000Z', period: 'Mañana', notes: 'Desde versión 1',
  };
  // Open the origin without starting React, which would immediately open the current schema.
  await page.route('**/__test-v1', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Versión anterior</title>' }));
  await page.goto('/__test-v1');
  await page.evaluate(async ({ moduleUrl, reading }) => {
    const { seedVersionOne } = await import(moduleUrl) as typeof import('./helpers/legacy-schema');
    await seedVersionOne(reading);
  }, { moduleUrl: '/tests/e2e/helpers/legacy-schema.ts', reading: original });
  await page.goto('/');
  await expect(page.getByText('133/81', { exact: true }).filter({ visible: true })).toBeVisible();
  expect(await readStoredReadings(page)).toEqual([original]);

  await page.evaluate(async moduleUrl => {
    const { setGeminiApiKey } = await import(moduleUrl) as typeof import('../../src/services/settingsService');
    await setGeminiApiKey('clave-sintética');
  }, '/src/services/settingsService.ts');
  await page.reload();
  await page.getByRole('button', { name: 'Configurar Clave API de Gemini' }).click();
  await expect(page.getByLabel('Clave de API', { exact: true })).toHaveValue('clave-sintética');
  expect(await readStoredReadings(page)).toEqual([original]);
});

test('si falla la segunda escritura de una importación revierte la primera y mantiene las tomas anteriores', async ({ page }) => {
  await page.goto('/');
  const original: BloodPressureRecord = {
    id: 1, systolic: 120, diastolic: 80, pulse: 70, timestamp: '2026-11-23T08:00:00.000Z', period: 'Mañana',
  };
  await seedReadings(page, [original]);

  const observed = await page.evaluate(async moduleUrl => {
    const { persistImportedRecords } = await import(moduleUrl) as typeof import('../../src/services/readingsService');
    const add = IDBObjectStore.prototype.add;
    let attempts = 0;
    let firstSucceeded = false;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name !== 'readings') return add.apply(this, args);
      if (++attempts === 2) throw new DOMException('Fallo de escritura simulado', 'QuotaExceededError');
      const request = add.apply(this, args);
      request.addEventListener('success', () => { firstSucceeded = true; });
      return request;
    };
    let errorName: string | undefined;
    try {
      await persistImportedRecords([
        { systolic: 130, diastolic: 80, pulse: 60, timestamp: '2026-11-24T08:00:00.000Z' },
        { systolic: 140, diastolic: 90, pulse: 65, timestamp: '2026-11-24T09:00:00.000Z' },
      ]);
    } catch (error) {
      errorName = (error as Error).name;
    } finally {
      IDBObjectStore.prototype.add = add;
    }
    return { attempts, firstSucceeded, errorName };
  }, '/src/services/readingsService.ts');

  expect(observed).toEqual({ attempts: 2, firstSucceeded: true, errorName: 'QuotaExceededError' });
  expect(await readStoredReadings(page)).toEqual([original]);
});
