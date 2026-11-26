import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readStoredReadings } from './helpers/indexedDb';

const history = (page: Page) => page.locator('section').filter({ has: page.getByRole('heading', { name: 'Historial' }) });

async function record(page: Page, systolic: string, timestamp: string) {
  await page.getByRole('button', { name: 'Nueva Toma', exact: true }).click();
  await page.getByLabel('Sistólica', { exact: true }).fill(systolic);
  await page.getByLabel('Fecha y Hora').fill(timestamp);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nueva Toma' })).toBeHidden();
}

test('el formulario vacío propone valores locales y no guarda al cancelar o con cifras fuera de rango', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-23T10:59:00Z'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Registrar Toma' }).click();
  const systolic = page.getByLabel('Sistólica', { exact: true });
  await expect(systolic).toHaveValue('120');
  await expect(page.getByLabel('Diastólica', { exact: true })).toHaveValue('80');
  await expect(page.getByLabel('Pulso', { exact: true })).toHaveValue('70');
  await expect(page.getByLabel('Fecha y Hora')).toHaveValue('2026-11-23T11:59');
  await systolic.fill('251');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nueva Toma' })).toBeVisible();
  expect(await systolic.evaluate(input => (input as HTMLInputElement).validity.rangeOverflow)).toBe(true);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.reload();
  await expect(page.getByText('No hay tomas registradas.')).toBeVisible();
});

test('crea, edita cruzando de franja y borra solo tras confirmar, con persistencia tras recarga', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.clock.setFixedTime(new Date('2026-11-23T10:59:00Z'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Nueva Toma', exact: true }).click();
  await page.getByLabel('Notas').fill('  Control sintético  ');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(history(page).getByText('120/80', { exact: true }).filter({ visible: true })).toBeVisible();
  const [original] = await readStoredReadings(page);
  expect(original).toMatchObject({ timestamp: '2026-11-23T10:59:00.000Z', period: 'Mañana' });
  await page.reload();

  const edit = history(page).getByRole('button', { name: 'Editar medición' });
  await expect(history(page).getByText('Sin lecturas en tarde/noche')).toBeVisible();
  await edit.click();
  await expect(page.getByLabel('Notas')).toHaveValue('Control sintético');
  await page.getByLabel('Fecha y Hora').fill('2026-11-23T12:00');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(history(page).getByText('Sin lecturas en la mañana')).toBeVisible();
  await page.reload();
  await expect(edit).toHaveCount(1);
  await expect(history(page).getByText('Tarde', { exact: true }).filter({ visible: true })).toBeVisible();
  expect(await readStoredReadings(page)).toEqual([{ ...original, timestamp: '2026-11-23T11:00:00.000Z', period: 'Tarde' }]);

  const remove = history(page).getByRole('button', { name: 'Eliminar medición' });
  page.once('dialog', dialog => dialog.dismiss());
  await remove.click();
  await expect(edit).toHaveCount(1);
  page.once('dialog', dialog => dialog.accept());
  await remove.click();
  await expect(page.getByText('No hay tomas registradas.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('No hay tomas registradas.')).toBeVisible();
});

test('agrupa por día local y muestra en móvil una sola fila visible por toma en orden descendente', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await record(page, '121', '2026-11-23T23:55');
  await record(page, '122', '2026-11-24T00:05');
  await record(page, '123', '2026-11-24T10:15');

  await expect(history(page).getByRole('heading', { level: 3 })).toHaveText([
    'martes, 24 de noviembre de 2026', 'lunes, 23 de noviembre de 2026',
  ]);
  await expect(history(page).getByText(/12[123]\/80/).filter({ visible: true })).toHaveText(['123/80', '122/80', '121/80']);
  await expect(history(page).getByText(/Tarde & Noche/).filter({ visible: true })).toHaveCount(0);
});
