import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const readings = [
  { timestamp: '2026-11-16T08:00:00Z', period: 'Mañana' },
  { timestamp: '2026-11-23T13:00:00Z', period: 'Tarde' },
].map(r => ({ ...r, systolic: 138, diastolic: 80, pulse: 65 }));

async function seed(page: Page, items: typeof readings) {
  await page.evaluate(async records => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('TensiaDatabase');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('readings', 'readwrite');
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onabort = () => { db.close(); reject(transaction.error); };
        for (const reading of records) transaction.objectStore('readings').add(reading);
      };
    });
  }, items);
  await page.reload();
}

async function openReport(page: Page) {
  await page.getByRole('button', { name: 'Registro AMPA', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Informe semanal AMPA' });
  await expect(dialog.getByLabel('Franjas incluidas')).toBeEnabled();
  return dialog;
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-25T12:00:00Z'));
  await page.goto('/');
  const dialog = await openReport(page);
  await expect(dialog.getByText('No hay lecturas para las franjas seleccionadas.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
});

test('restaura preferencias y descarga un único PDF antes de cerrar el formulario', async ({ page }) => {
  await seed(page, readings);
  let dialog = await openReport(page);
  await expect(dialog.getByLabel('Semana del informe')).toHaveValue('2026-11-23');
  await dialog.getByLabel('Franjas incluidas').selectOption('morning-night');
  await expect(dialog.getByLabel('Semana del informe')).toHaveValue('2026-11-16');

  const values = [['Nombre', 'Fernando'], ['Fecha de nacimiento', '1971-11-30'],
    ['Medicación', 'Enalapril 10'], ['Tensiómetro', 'AILE']];
  for (const [label, value] of values) await dialog.getByLabel(label, { exact: true }).fill(value);
  await dialog.getByLabel('Brazo usado').selectOption('Izquierdo');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await page.reload();

  dialog = await openReport(page);
  for (const [label, value] of values) await expect(dialog.getByLabel(label, { exact: true })).toHaveValue(value);
  await expect(dialog.getByLabel('Brazo usado')).toHaveValue('Izquierdo');
  await expect(dialog.getByLabel('Franjas incluidas')).toHaveValue('morning-night');
  await expect(dialog.getByLabel('Semana del informe')).toHaveValue('2026-11-16');
  const downloads: string[] = [];
  page.on('download', file => downloads.push(file.suggestedFilename()));
  const pending = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Generar y descargar PDF' }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('AMPA_2026-11-16_2026-11-22.pdf');
  const pdf = await readFile(await download.path(), 'latin1');
  expect(pdf).toMatch(/^%PDF-/);
  expect(pdf).toContain('Franjas: Solo mañana y noche');
  expect(pdf).toContain('(Fernando)');
  await expect(dialog).toHaveCount(0);
  expect(downloads).toEqual(['AMPA_2026-11-16_2026-11-22.pdf']);
  await expect(page.getByRole('button', { name: 'Compartir', exact: true })).toHaveCount(1);
});

test('mantiene abierto el formulario sin datos, con campos incompletos o si falla la descarga', async ({ page }) => {
  await seed(page, readings.slice(1));
  const dialog = await openReport(page);
  const generate = dialog.getByRole('button', { name: 'Generar y descargar PDF' });
  await dialog.getByLabel('Franjas incluidas').selectOption('morning-night');
  await expect(generate).toBeDisabled();
  await expect(dialog.getByText('No hay lecturas para las franjas seleccionadas.')).toBeVisible();
  await dialog.getByLabel('Franjas incluidas').selectOption('all');
  await generate.click();
  await expect(dialog.getByText('Completa los datos de cabecera.', { exact: false })).toBeVisible();

  await dialog.getByLabel('Nombre', { exact: true }).fill('Fernando');
  await dialog.getByLabel('Fecha de nacimiento').fill('1971-11-30');
  await dialog.getByLabel('Medicación').fill('Sin medicación');
  await dialog.getByLabel('Tensiómetro').fill('AILE');
  await dialog.getByLabel('Brazo usado').selectOption('Izquierdo');
  await page.evaluate(() => {
    URL.createObjectURL = () => { throw new Error('Fallo de descarga simulado'); };
  });
  await generate.click();
  await expect(dialog.getByText('No se pudo preparar el informe. Inténtalo de nuevo.')).toBeVisible();
  await expect(dialog).toBeVisible();
});

test('ordena los accesos directos y abre la importación desde el menú', async ({ page }) => {
  const shortcuts = page.getByRole('group', { name: 'Accesos directos' });
  await expect(shortcuts.getByRole('button')).toHaveText(['Registro AMPA', 'PDF', 'Compartir', 'Backup']);

  const importButton = page.getByRole('button', { name: 'Importar JSON', exact: true });
  await expect(importButton).toHaveCount(0);
  await page.getByRole('button', { name: 'Más opciones', exact: true }).click();
  const pending = page.waitForEvent('filechooser');
  await importButton.click();
  const chooser = await pending;
  await chooser.setFiles({
    name: 'lecturas.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(readings)),
  });
  await expect(page.getByText('Resumen de Importación', { exact: true })).toBeVisible();
});

test('PDF general propone el intervalo completo y comparte el perfil con AMPA', async ({ page }) => {
  await seed(page, readings);
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Informe de lecturas de presión arterial' });
  await expect(dialog.getByLabel('Desde')).toHaveValue('2026-11-16');
  await expect(dialog.getByLabel('Hasta')).toHaveValue('2026-11-23');
  for (const [label, value] of [['Nombre', 'Fernando'], ['Fecha de nacimiento', '1971-11-30'],
    ['Medicación', 'Sin medicación'], ['Tensiómetro', 'AILE']]) {
    await dialog.getByLabel(label, { exact: true }).fill(value);
  }
  await dialog.getByLabel('Brazo usado').selectOption('Izquierdo');
  const generate = dialog.getByRole('button', { name: 'Generar y descargar PDF' });
  await dialog.getByLabel('Hasta').fill('2026-11-15');
  await generate.click();
  await expect(dialog.getByText(/Indica un intervalo válido/)).toBeVisible();
  await dialog.getByLabel('Hasta').fill('2026-11-16');
  const pending = page.waitForEvent('download');
  await generate.click();
  expect((await pending).suggestedFilename()).toBe('Tensia-Informe_2026-11-16_2026-11-16.pdf');
  await expect(dialog).toHaveCount(0);

  await page.reload();
  const ampa = await openReport(page);
  await expect(ampa.getByLabel('Nombre', { exact: true })).toHaveValue('Fernando');
  await ampa.getByLabel('Nombre', { exact: true }).fill('Fernando Pérez');
  await ampa.getByRole('button', { name: 'Cerrar' }).click();
  await page.getByRole('button', { name: 'Más opciones', exact: true }).click();
  await page.getByRole('button', { name: 'Exportar PDF', exact: true }).click();
  await expect(dialog.getByLabel('Nombre', { exact: true })).toHaveValue('Fernando Pérez');
});
