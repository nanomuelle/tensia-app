import { useState, useEffect, useCallback } from 'react';
import { getGeminiApiKey, setGeminiApiKey, removeGeminiApiKey } from '../services/settingsService';
import { testGeminiApiKey } from '../services/geminiService';

export interface ApiKeyTestResult {
  success: boolean;
  message: string;
}

export function useApiKey() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ApiKeyTestResult | null>(null);
  const [showKey, setShowKey] = useState(false);

  const loadApiKey = useCallback(async () => {
    try {
      const val = await getGeminiApiKey();
      setApiKey(val || '');
      return val;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    loadApiKey();
  }, [loadApiKey]);

  const testKey = useCallback(async (keyToTest?: string): Promise<ApiKeyTestResult> => {
    const key = (keyToTest !== undefined ? keyToTest : apiKey).trim();
    if (!key) {
      const res = { success: false, message: 'Introduce una clave de API.' };
      setTestResult(res);
      return res;
    }
    setTesting(true);
    setTestResult(null);
    try {
      await testGeminiApiKey(key);
      const res = { success: true, message: '¡Clave de API válida!' };
      setTestResult(res);
      return res;
    } catch (err: any) {
      const res = { success: false, message: err.message || 'Error al verificar.' };
      setTestResult(res);
      return res;
    } finally {
      setTesting(false);
    }
  }, [apiKey]);

  const saveApiKey = useCallback(async (keyToSave?: string): Promise<boolean> => {
    const key = (keyToSave !== undefined ? keyToSave : apiKey).trim();
    setLoading(true);
    try {
      await setGeminiApiKey(key);
      setApiKey(key);
      return true;
    } catch (err) {
      setTestResult({ success: false, message: 'Error al guardar.' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  const removeApiKey = useCallback(async (): Promise<boolean> => {
    try {
      await removeGeminiApiKey();
      setApiKey('');
      setTestResult({ success: true, message: 'Clave eliminada.' });
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  return {
    apiKey,
    setApiKey,
    loading,
    setLoading,
    testing,
    testResult,
    setTestResult,
    showKey,
    setShowKey,
    loadApiKey,
    saveApiKey,
    removeApiKey,
    testApiKey: testKey,
  };
}

export default useApiKey;
