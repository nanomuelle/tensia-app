import Dexie from 'dexie';
import type { BloodPressureRecord } from '../../../src/services/db';

export async function seedVersionOne(reading: BloodPressureRecord): Promise<void> {
  const db = new Dexie('TensiaDatabase');
  db.version(1).stores({ readings: '++id, systolic, diastolic, pulse, timestamp, period' });
  try {
    await db.table('readings').add(reading);
  } finally {
    db.close();
  }
}
