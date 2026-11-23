import type { AmpaPeriods } from './ampaReport';
import { db } from './db';

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

export interface AmpaProfile {
  name: string;
  birthDate: string;
  medication: string;
  monitor: string;
  arm: '' | 'Izquierdo' | 'Derecho';
  periods?: AmpaPeriods;
}

const ampaProfileKey = 'ampa_report_profile';

export async function getAmpaProfile(): Promise<AmpaProfile | null> {
  const record = await db.settings.get(ampaProfileKey);
  return record ? JSON.parse(record.value) : null;
}

export async function saveAmpaProfile(changes: Partial<AmpaProfile>): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    const existing = await getAmpaProfile();
    await db.settings.put({ key: ampaProfileKey, value: JSON.stringify({ ...existing, ...changes }) });
  });
}
