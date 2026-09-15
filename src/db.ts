import { db } from './services/db';

export * from './services/db';
export * from './services/readingsService';


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

