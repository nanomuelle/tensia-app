import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { readStoredReadings, seedReadings } from './helpers/indexedDb';
import type { BloodPressureRecord } from '../../src/services/db';

const original: BloodPressureRecord = {
  id: 1, systolic: 120, diastolic: 80, pulse: 70, timestamp: '2026-11-23T11:00:00.000Z', period: 'Tarde',
};
const incoming = {
  id: 400, systolic: '133', diastolic: 81, pulse: 64, timestamp: '2026-11-24T07:00:00+01:00', period: 'Noche', notes: '  Control sintético  ',
};

async function loadFile(page: Page, buffer: Buffer) {
  await page.getByRole('button', { name: 'Más opciones', exact: true }).click();
  const pending = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Importar JSON', exact: true }).click();
  await (await pending).setFiles({ name: 'lecturas.json', mimeType: 'application/json', buffer });
}

const confirm = (page: Page) => page.getByRole('button', { name: 'Confirmar e Importar' });

async function expectSummary(page: Page, total: number, added: number, duplicates: number, invalid = 0) {
  await expect(page.getByRole('heading', { name: 'Resumen de Importación' })).toBeVisible();
  await expect(page.getByText(`Total en el fichero: ${total}`)).toBeVisible();
  await expect(page.getByText('Nuevas a importar', { exact: true }).locator('..')).toHaveText(`${added}Nuevas a importar`);
  await expect(page.getByText('Duplicados omitidos', { exact: true }).locator('..')).toHaveText(`${duplicates}Duplicados omitidos`);
  if (invalid) await expect(page.getByText('Registros inválidos descartados:').locator('..')).toHaveText(new RegExp(`${invalid}$`));
}

test('analiza sin escribir, fusiona al confirmar y no duplica al repetir el archivo', async ({ page }) => {
  await page.goto('/');
  await seedReadings(page, [original]);
  await page.reload();
  const buffer = Buffer.from(JSON.stringify([
    { ...original, timestamp: '2026-11-23T12:00:00+01:00', notes: ' ' },
    incoming, incoming, { ...incoming, timestamp: 'fecha inválida' },
  ]));

  await loadFile(page, buffer);
  await expectSummary(page, 4, 1, 2, 1);
  expect(await readStoredReadings(page)).toEqual([original]);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(await readStoredReadings(page)).toEqual([original]);

  await loadFile(page, buffer);
  await confirm(page).click();
  await expect(page.getByText('¡Se han importado 1 lecturas nuevas con éxito!')).toBeVisible();
  await page.reload();
  await expect(page.getByText('133/81', { exact: true }).filter({ visible: true })).toBeVisible();
  const stored = await readStoredReadings(page);
  expect(stored).toEqual([original, {
    id: expect.any(Number), systolic: 133, diastolic: 81, pulse: 64,
    timestamp: '2026-11-24T06:00:00.000Z', period: 'Mañana', notes: 'Control sintético',
  }]);
  expect(stored[1].id).not.toBe(incoming.id);

  await loadFile(page, buffer);
  await expectSummary(page, 4, 0, 3, 1);
  await expect(confirm(page)).toBeDisabled();
  expect(await readStoredReadings(page)).toEqual(stored);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await loadFile(page, Buffer.from(JSON.stringify([{ ...incoming, notes: 'Otra nota' }])));
  await expectSummary(page, 1, 1, 0);
});

const rejectedFiles = [
  { input: '[', message: 'El archivo no contiene un JSON válido.' },
  { input: '{}', message: 'El formato del archivo JSON no es válido (se esperaba una lista de lecturas).' },
  { input: '[]', message: 'Error al leer el archivo.', unreadable: true },
];

for (const { input, message, unreadable } of rejectedFiles) {
  test(`avisa y permite reintentar: ${message}`, async ({ page }) => {
    await page.goto('/');
    if (unreadable) {
      await page.evaluate(() => {
        const read = FileReader.prototype.readAsText;
        FileReader.prototype.readAsText = function () {
          FileReader.prototype.readAsText = read;
          this.dispatchEvent(new Event('error'));
        };
      });
    }
    const pending = page.waitForEvent('dialog');
    const submitted = loadFile(page, Buffer.from(input));
    const alert = await pending;
    const observed = alert.message();
    await alert.accept();
    await submitted;
    expect(observed).toBe(message);
    expect(await readStoredReadings(page)).toEqual([]);
    await loadFile(page, Buffer.from('[]'));
    await expectSummary(page, 0, 0, 0);
    await expect(confirm(page)).toBeDisabled();
  });
}

test('descarga solo las tomas y la copia se puede restaurar en un contexto limpio', async ({ page, browser }) => {
  await page.goto('/');
  await seedReadings(page, [{ ...original, id: 23 }]);
  await page.evaluate(async moduleUrl => {
    const { db } = await import(moduleUrl) as typeof import('../../src/services/db');
    await db.settings.bulkPut([
      { key: 'gemini_api_key', value: 'clave-sintética' },
      { key: 'ampa_report_profile', value: JSON.stringify({ name: 'Perfil sintético' }) },
    ]);
    localStorage.setItem('tensia_privacy_accepted', 'true');
  }, '/src/services/db.ts');
  await page.reload();

  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup', exact: true }).click();
  const file = await pending;
  expect(file.suggestedFilename()).toBe('Tensia-Backup.json');
  const bytes = await readFile(await file.path());
  expect(JSON.parse(bytes.toString('utf8'))).toEqual([{ ...original, id: 23 }]);

  const context = await browser.newContext({ timezoneId: 'Europe/Madrid' });
  try {
    const restored = await context.newPage();
    await restored.goto(page.url());
    await loadFile(restored, bytes);
    await expectSummary(restored, 1, 1, 0);
    await confirm(restored).click();
    await expect(restored.getByText('¡Se han importado 1 lecturas nuevas con éxito!')).toBeVisible();
    await restored.reload();
    await expect(restored.getByText('120/80', { exact: true }).filter({ visible: true })).toBeVisible();
    expect(await readStoredReadings(restored)).toEqual([{ ...original, notes: undefined, id: expect.any(Number) }]);
  } finally {
    await context.close();
  }
});
