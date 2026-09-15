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

export interface AppSetting {
  key: string;
  value: string;
}

export class BloodPressureDatabase extends Dexie {
  readings!: Table<BloodPressureRecord, number>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('TensiaDatabase');
    this.version(1).stores({
      readings: '++id, systolic, diastolic, pulse, timestamp, period'
    });
    this.version(2).stores({
      readings: '++id, systolic, diastolic, pulse, timestamp, period',
      settings: 'key'
    });
  }
}

export const db = new BloodPressureDatabase();
