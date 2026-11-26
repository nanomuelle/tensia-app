import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readStoredReadings } from './helpers/indexedDb';

const key = 'clave-sintética';
const extracted = { systolic: 132, diastolic: 81, pulse: 64 };
const photoButton = (page: Page) => page.getByRole('button', { name: 'Foto y listo', exact: true });
const photoPicker = (page: Page) => page.getByRole('heading', { name: 'Foto del Tensiómetro' });
const keyInput = (page: Page) => page.getByLabel('Clave de API', { exact: true });

async function routeGemini(page: Page, result: () => { status: number; json: object }) {
  const images: { mime_type: string; data: string }[] = [];
  let requests = 0;
  await page.route('https://generativelanguage.googleapis.com/**', route => {
    requests++;
    const parts = route.request().postDataJSON().contents[0].parts;
    const image = parts.find((part: { inline_data?: unknown }) => part.inline_data)?.inline_data;
    if (image) images.push(image);
    return route.fulfill(result());
  });
  return { images, requestCount: () => requests };
}

const success = (reading = extracted) => ({ status: 200, json: {
  candidates: [{ content: { parts: [{ text: JSON.stringify(reading) }] } }],
} });
const denied = () => ({ status: 403, json: { error: { message: 'Clave rechazada en prueba' } } });

async function configureKey(page: Page) {
  await photoButton(page).click();
  await keyInput(page).fill(key);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Clave API Gemini' })).toBeHidden();
}

async function choosePhoto(page: Page, source: 'cámara' | 'galería', valid = true) {
  const input = source === 'cámara' ? 'Hacer Foto con Cámara' : 'Seleccionar de la Galería';
  const png = valid ? await page.evaluate(([width, height]) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fc0';
    ctx.fillRect(1, 1, 400, 300);
    return canvas.toDataURL('image/png').split(',')[1];
  }, source === 'cámara' ? [800, 1600] : [1600, 800]) : null;
  const pending = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: input, exact: true }).click();
  const chooser = await pending;
  expect(await chooser.element().getAttribute('capture')).toBe(source === 'cámara' ? 'environment' : null);
  await chooser.setFiles({ name: 'sintetica.png', mimeType: 'image/png', buffer: png ? Buffer.from(png, 'base64') : Buffer.from('no es PNG') });
}

async function acceptPrivacy(page: Page) {
  await photoButton(page).click();
  await page.getByRole('button', { name: 'Aceptar y Continuar' }).click();
  await expect(photoPicker(page)).toBeVisible();
}

test('permite probar, guardar y borrar la clave, y probarla no la guarda', async ({ page }) => {
  let response = denied();
  const gemini = await routeGemini(page, () => response);
  await page.goto('/');
  await photoButton(page).click();
  await expect(page.getByRole('heading', { name: 'Clave API Gemini' })).toBeVisible();
  expect(gemini.requestCount()).toBe(0);
  await expect(page.getByRole('button', { name: 'Probar' })).toBeDisabled();
  await keyInput(page).fill(` ${key} `);
  await expect(keyInput(page)).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Mostrar clave' }).click();
  await expect(keyInput(page)).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar clave' }).click();
  await expect(keyInput(page)).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Probar' }).click();
  await expect(page.getByText('Clave rechazada en prueba')).toBeVisible();
  response = { status: 200, json: { candidates: [{ content: { parts: [{ text: 'OK' }] } }] } };
  await page.getByRole('button', { name: 'Probar' }).click();
  await expect(page.getByText('¡Clave de API válida!')).toBeVisible();
  expect(gemini.requestCount()).toBe(2);
  expect(gemini.images).toEqual([]);
  await page.reload();
  await photoButton(page).click();
  await expect(keyInput(page)).toHaveValue('');
  await keyInput(page).fill(` ${key} `);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Clave API Gemini' })).toBeHidden();
  await page.reload();
  await page.getByRole('button', { name: 'Configurar Clave API de Gemini' }).click();
  await expect(keyInput(page)).toHaveValue(key);
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Borrar' }).click();
  await expect(keyInput(page)).toHaveValue(key);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Borrar' }).click();
  await expect(keyInput(page)).toHaveValue('');
  await page.reload();
  await photoButton(page).click();
  await expect(keyInput(page)).toHaveValue('');
  expect(gemini.requestCount()).toBe(2);
});

test('el consentimiento se recuerda; cámara y galería envían JPEG redimensionado y solo Guardar crea una toma', async ({ page }) => {
  const gemini = await routeGemini(page, () => success());
  await page.clock.setFixedTime(new Date('2026-11-23T10:59:00Z'));
  await page.goto('/');
  await configureKey(page);
  await photoButton(page).click();
  await expect(page.getByRole('heading', { name: 'Aviso de Privacidad (IA)' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(photoPicker(page)).toBeHidden();
  expect(gemini.requestCount()).toBe(0);
  await acceptPrivacy(page);
  await page.reload();
  await photoButton(page).click();
  await expect(photoPicker(page)).toBeVisible();
  await choosePhoto(page, 'cámara');
  await expect(page.getByLabel('Sistólica', { exact: true })).toHaveValue('132');
  await expect(page.getByLabel('Diastólica', { exact: true })).toHaveValue('81');
  await expect(page.getByLabel('Pulso', { exact: true })).toHaveValue('64');
  await expect(page.getByLabel('Fecha y Hora')).toHaveValue('2026-11-23T11:59');
  await expect(page.getByLabel('Notas')).toHaveValue('Capturado con foto y Gemini AI');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(await readStoredReadings(page)).toEqual([]);

  await photoButton(page).click();
  await choosePhoto(page, 'galería');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('132/81', { exact: true }).filter({ visible: true })).toBeVisible();
  expect(gemini.requestCount()).toBe(2);
  expect(gemini.images.map(image => image.mime_type)).toEqual(['image/jpeg', 'image/jpeg']);
  for (const [index, { data }] of gemini.images.entries()) {
    expect(Buffer.from(data, 'base64').subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
    const dimensions = await page.evaluate(async encoded => {
      const img = new Image();
      img.src = `data:image/jpeg;base64,${encoded}`;
      await img.decode();
      return [img.naturalWidth, img.naturalHeight];
    }, data);
    expect(dimensions).toEqual(index === 0 ? [512, 1024] : [1024, 512]);
  }
  expect(await readStoredReadings(page)).toEqual([{
    id: expect.any(Number), ...extracted, timestamp: '2026-11-23T10:59:00.000Z', period: 'Mañana', notes: 'Capturado con foto y Gemini AI',
  }]);
  const settings = await page.evaluate(async moduleUrl => {
    const { db } = await import(moduleUrl) as typeof import('../../src/services/db');
    return db.settings.toArray();
  }, '/src/services/db.ts');
  expect(settings).toEqual([{ key: 'gemini_api_key', value: key }]);
});

test('una imagen inválida no se envía y un error de Gemini permite volver al registro manual', async ({ page }) => {
  const gemini = await routeGemini(page, denied);
  await page.goto('/');
  await configureKey(page);
  await acceptPrivacy(page);
  await choosePhoto(page, 'galería', false);
  await expect(page.getByText('Error al analizar la imagen con Gemini.')).toBeVisible();
  expect(gemini.requestCount()).toBe(0);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await photoButton(page).click();
  await choosePhoto(page, 'galería');
  await expect(page.getByText('Clave rechazada en prueba')).toBeVisible();
  expect(gemini.requestCount()).toBe(1);
  expect(await readStoredReadings(page)).toEqual([]);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar Toma' }).click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('120/80', { exact: true }).filter({ visible: true })).toBeVisible();
  expect(gemini.requestCount()).toBe(1);
});

test('una sugerencia fuera de rango no se puede guardar', async ({ page }) => {
  await routeGemini(page, () => success({ ...extracted, systolic: 251 }));
  await page.goto('/');
  await configureKey(page);
  await acceptPrivacy(page);
  await choosePhoto(page, 'galería');
  await expect(page.getByLabel('Sistólica', { exact: true })).toHaveValue('251');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nueva Toma' })).toBeVisible();
  expect(await readStoredReadings(page)).toEqual([]);
});
