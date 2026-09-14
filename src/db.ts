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

export interface ImportAnalysisResult {
  totalInFile: number;
  newValidRecords: Omit<BloodPressureRecord, 'id' | 'period'>[];
  duplicatesCount: number;
  invalidCount: number;
}

export async function analyzeJsonImport(jsonString: string): Promise<ImportAnalysisResult> {
  let rawData: any;
  try {
    rawData = JSON.parse(jsonString);
  } catch (err) {
    throw new Error('El archivo no contiene un JSON válido.');
  }

  if (!Array.isArray(rawData)) {
    throw new Error('El formato del archivo JSON no es válido (se esperaba una lista de lecturas).');
  }

  const existingReadings = await db.readings.toArray();

  let duplicatesCount = 0;
  let invalidCount = 0;
  const newValidRecords: Omit<BloodPressureRecord, 'id' | 'period'>[] = [];
  
  // Track seen items within the file itself to prevent internal duplicate batch inserts
  const seenInImport = new Set<string>();

  for (const item of rawData) {
    if (!item || typeof item !== 'object') {
      invalidCount++;
      continue;
    }

    const sys = parseInt(item.systolic, 10);
    const dia = parseInt(diastolicValue(item), 10); // helper or item.diastolic
    const pul = parseInt(item.pulse, 10);
    const timestamp = item.timestamp;
    const notes = typeof item.notes === 'string' ? item.notes.trim() : (item.notes || undefined);

    // Validation rules as defined in manual entry
    // systolic: 40-250, diastolic: 20-160, pulse: 10-250, timestamp valid
    if (
      isNaN(sys) || sys < 40 || sys > 250 ||
      isNaN(dia) || dia < 20 || dia > 160 ||
      isNaN(pul) || pul < 10 || pul > 250 ||
      !timestamp || isNaN(new Date(timestamp).getTime())
    ) {
      invalidCount++;
      continue;
    }

    const normalizedTimestamp = new Date(timestamp).toISOString();

    // Deduplication key by exact values (excluding id): systolic, diastolic, pulse, timestamp, notes
    const recordKey = `${sys}|${dia}|${pul}|${normalizedTimestamp}|${notes || ''}`;

    if (seenInImport.has(recordKey)) {
      duplicatesCount++;
      continue;
    }

    // Check against existing database records
    const isDuplicateExisting = existingReadings.some(ex => {
      const exNotes = typeof ex.notes === 'string' ? ex.notes.trim() : (ex.notes || '');
      const itemNotes = notes || '';
      return (
        ex.systolic === sys &&
        ex.diastolic === dia &&
        ex.pulse === pul &&
        new Date(ex.timestamp).toISOString() === normalizedTimestamp &&
        exNotes === itemNotes
      );
    });

    if (isDuplicateExisting) {
      duplicatesCount++;
      continue;
    }

    seenInImport.add(recordKey);
    newValidRecords.push({
      systolic: sys,
      diastolic: dia,
      pulse: pul,
      timestamp: normalizedTimestamp,
      notes: notes || undefined
    });
  }

  return {
    totalInFile: rawData.length,
    newValidRecords,
    duplicatesCount,
    invalidCount
  };
}

function diastolicValue(item: any): any {
  return item.diastolic;
}

export async function persistImportedRecords(records: Omit<BloodPressureRecord, 'id' | 'period'>[]): Promise<number> {
  if (records.length === 0) return 0;
  await db.transaction('rw', db.readings, async () => {
    for (const rec of records) {
      const date = new Date(rec.timestamp);
      const period = getPeriod(date);
      await db.readings.add({
        ...rec,
        period
      });
    }
  });
  return records.length;
}

export async function exportDatabaseToJson(): Promise<string> {
  const all = await db.readings.toArray();
  return JSON.stringify(all, null, 2);
}

// Settings / Gemini API Key helper functions
export async function getGeminiApiKey(): Promise<string | null> {
  try {
    const record = await db.settings.get('gemini_api_key');
    return record ? record.value : null;
  } catch (err) {
    console.error('Error fetching Gemini API key:', err);
    return null;
  }
}

export async function setGeminiApiKey(apiKey: string): Promise<void> {
  await db.settings.put({ key: 'gemini_api_key', value: apiKey.trim() });
}

export async function removeGeminiApiKey(): Promise<void> {
  await db.settings.delete('gemini_api_key');
}

