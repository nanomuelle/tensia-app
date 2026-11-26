import type { Page } from '@playwright/test';
import type { BloodPressureRecord } from '../../../src/services/db';

export async function seedReadings(page: Page, items: readonly BloodPressureRecord[]): Promise<void> {
  await page.evaluate(async ({ moduleUrl, records }) => {
    const { db } = await import(moduleUrl) as typeof import('../../../src/services/db');
    await db.readings.bulkAdd([...records]);
  }, { moduleUrl: '/src/services/db.ts', records: items });
}

export async function readStoredReadings(page: Page): Promise<BloodPressureRecord[]> {
  return page.evaluate(async moduleUrl => {
    const { db } = await import(moduleUrl) as typeof import('../../../src/services/db');
    return db.readings.toArray();
  }, '/src/services/db.ts');
}
