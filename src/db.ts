import Dexie, { Table } from 'dexie';

export type TimePeriod = 'Mañana' | 'Tarde' | 'Noche';

export interface BloodPressureRecord {
  id?: number;
  systolic: number;
  diastolic: number;
  pulse: number;
  timestamp: string; // ISO string
  period: TimePeriod;
  notes?: string;
}

export class BloodPressureDatabase extends Dexie {
  readings!: Table<BloodPressureRecord, number>;

  constructor() {
    super('TensiaDatabase');
    this.version(1).stores({
      readings: '++id, systolic, diastolic, pulse, timestamp, period'
    });
  }
}

export const db = new BloodPressureDatabase();

export function getPeriod(date: Date): TimePeriod {
  const hours = date.getHours();
  // Mañana: 06:00 - 11:59
  // Tarde: 12:00 - 19:59
  // Noche: 20:00 - 05:59
  if (hours >= 6 && hours < 12) {
    return 'Mañana';
  } else if (hours >= 12 && hours < 20) {
    return 'Tarde';
  } else {
    return 'Noche';
  }
}

export async function addReading(data: Omit<BloodPressureRecord, 'id' | 'period'>): Promise<number> {
  const date = new Date(data.timestamp);
  const period = getPeriod(date);
  const id = await db.readings.add({
    ...data,
    period
  });
  return id;
}

export async function updateReading(id: number, data: Partial<Omit<BloodPressureRecord, 'id'>>): Promise<number> {
  let updateData: any = { ...data };
  if (data.timestamp) {
    const date = new Date(data.timestamp);
    updateData.period = getPeriod(date);
  }
  await db.readings.update(id, updateData);
  return id;
}

export async function deleteReading(id: number): Promise<void> {
  await db.readings.delete(id);
}

export async function getAllReadings(): Promise<BloodPressureRecord[]> {
  return await db.readings.orderBy('timestamp').reverse().toArray();
}

export async function importDatabaseFromJson(jsonString: string): Promise<number> {
  const data = JSON.parse(jsonString);
  if (!Array.isArray(data)) {
    throw new Error('El formato del archivo JSON no es válido.');
  }
  await db.transaction('rw', db.readings, async () => {
    await db.readings.clear();
    await db.readings.bulkAdd(data.map((item: any) => {
      delete item.id; // Let Dexie assign new IDs or keep if needed, better let auto-increment handle or bulkPut
      return item;
    }));
  });
  return data.length;
}

export async function exportDatabaseToJson(): Promise<string> {
  const all = await db.readings.toArray();
  return JSON.stringify(all, null, 2);
}
