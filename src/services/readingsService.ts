import { db, BloodPressureRecord, TimePeriod } from './db';

export type { BloodPressureRecord, TimePeriod };

export const PRESSURE_RANGES = {
  systolic: { min: 40, max: 250 },
  diastolic: { min: 20, max: 160 },
  pulse: { min: 10, max: 250 }
} as const;

export function isValidSystolic(sys: number): boolean {
  return !isNaN(sys) && sys >= PRESSURE_RANGES.systolic.min && sys <= PRESSURE_RANGES.systolic.max;
}

export function isValidDiastolic(dia: number): boolean {
  return !isNaN(dia) && dia >= PRESSURE_RANGES.diastolic.min && dia <= PRESSURE_RANGES.diastolic.max;
}

export function isValidPulse(pul: number): boolean {
  return !isNaN(pul) && pul >= PRESSURE_RANGES.pulse.min && pul <= PRESSURE_RANGES.pulse.max;
}

export function validateReading(sys: number, dia: number, pul: number): { isValid: boolean; error?: string } {
  if (!isValidSystolic(sys)) {
    return { isValid: false, error: 'Sistólica entre 40 y 250.' };
  }
  if (!isValidDiastolic(dia)) {
    return { isValid: false, error: 'Diastólica entre 20 y 160.' };
  }
  if (!isValidPulse(pul)) {
    return { isValid: false, error: 'Pulso entre 10 y 250.' };
  }
  return { isValid: true };
}

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

export interface BloodPressureCategory {
  label: string;
  color: string;
}

export function getCategory(sys: number, dia: number): BloodPressureCategory {
  if (sys < 120 && dia < 80) return { label: 'Óptima', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (sys <= 129 && dia <= 84) return { label: 'Normal', color: 'bg-green-100 text-green-800 border-green-300' };
  if (sys <= 139 || dia <= 89) return { label: 'Normal-Alta', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
  if (sys <= 159 || dia <= 99) return { label: 'Grado 1', color: 'bg-orange-100 text-orange-800 border-orange-300' };
  if (sys <= 179 || dia <= 109) return { label: 'Grado 2', color: 'bg-red-100 text-red-800 border-red-300' };
  return { label: 'Grado 3', color: 'bg-rose-200 text-rose-900 border-rose-400 font-bold' };
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
  const updateData: any = { ...data };
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
      delete item.id;
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

function diastolicValue(item: any): any {
  return item.diastolic;
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
  
  // Track seen in this import batch to avoid duplicate inserts if the file contains duplicates
  const seenInImport = new Set<string>();

  for (const item of rawData) {
    if (!item || typeof item !== 'object') {
      invalidCount++;
      continue;
    }

    const sys = parseInt(item.systolic, 10);
    const dia = parseInt(diastolicValue(item), 10);
    const pul = parseInt(item.pulse, 10);
    const timestamp = item.timestamp;
    const notes = typeof item.notes === 'string' ? item.notes.trim() : (item.notes || undefined);

    // Validation rules as defined in manual entry
    // systolic: 40-250, diastolic: 20-160, pulse: 10-250, timestamp valid
    if (
      !isValidSystolic(sys) ||
      !isValidDiastolic(dia) ||
      !isValidPulse(pul) ||
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
