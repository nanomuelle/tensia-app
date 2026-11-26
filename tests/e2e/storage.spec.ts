import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

type Permission = 'granted' | 'denied' | 'exception' | 'unsupported' | 'already-granted' | 'no-api';

async function simulatePermission(page: Page, state: Permission) {
  await page.addInitScript(mode => {
    const storage = navigator.storage;
    Object.defineProperty(storage, 'persisted', {
      value: mode === 'no-api' ? undefined : async () => mode === 'already-granted',
    });
    Object.defineProperty(storage, 'persist', {
      value: mode === 'unsupported' || mode === 'no-api' ? undefined : async () => {
        // Keep the promise pending until the test releases it; the UI must prevent a second call.
        await new Promise<void>(resolve => window.addEventListener('test:resolve-persistence', () => resolve(), { once: true }));
        if (mode === 'exception' || mode === 'already-granted') throw new Error('Solicitud de persistencia inesperada o fallida');
        return mode === 'granted';
      },
    });
  }, state);
}

const activate = (page: Page) => page.getByRole('button', { name: 'Activar', exact: true });
const banner = (page: Page) => page.getByText('Almacenamiento local protegido', { exact: true });

for (const [state, message] of [
  ['granted', 'El almacenamiento persistente está activado correctamente.'],
  ['denied', 'El navegador rechazó la solicitud de almacenamiento persistente.'],
  ['exception', 'No se pudo completar la solicitud de almacenamiento persistente.'],
  ['unsupported', 'La función de almacenamiento persistente no es compatible con este navegador.'],
] as const) {
  test(`muestra el resultado de la solicitud de persistencia: ${state}`, async ({ page }) => {
    await simulatePermission(page, state);
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
    await activate(page).click();
    if (state !== 'unsupported') {
      await expect(page.getByRole('button', { name: 'Activando...' })).toBeDisabled();
      await page.evaluate(() => window.dispatchEvent(new Event('test:resolve-persistence')));
    }
    await expect(page.getByRole('status')).toContainText(message);
    if (state === 'granted') await expect(activate(page)).toBeHidden();
    else await expect(activate(page)).toBeEnabled();

    if (state === 'denied') {
      await page.getByRole('button', { name: 'Registrar Toma' }).click();
      await page.getByRole('button', { name: 'Guardar', exact: true }).click();
      await expect(page.getByText('120/80', { exact: true }).filter({ visible: true })).toBeVisible();
      await page.reload();
      await expect(page.getByText('120/80', { exact: true }).filter({ visible: true })).toBeVisible();
    }
  });
}

test('cerrar el aviso mantiene el descarte al recargar', async ({ page }) => {
  await simulatePermission(page, 'denied');
  await page.goto('/');
  await expect(banner(page)).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar aviso' }).click();
  await expect(banner(page)).toBeHidden();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Registrar Toma' })).toBeEnabled();
  await expect(banner(page)).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('tensia_dismiss_persistence_banner'))).toBe('true');
});

for (const state of ['already-granted', 'no-api'] as const) {
  test(`el registro no depende de mostrar el aviso: ${state}`, async ({ page }) => {
    await simulatePermission(page, state);
    await page.goto('/');
    await page.getByRole('button', { name: 'Registrar Toma' }).click();
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByText('120/80', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(banner(page)).toBeHidden();
  });
}
