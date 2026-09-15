import React, { useState, useEffect } from 'react';
import { Key, Check, AlertCircle, X, Shield, Eye, Trash2 } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey, removeGeminiApiKey } from '../services/settingsService';
import { testGeminiApiKey } from '../services/gemini';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onSaved }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getGeminiApiKey().then((val) => setApiKey(val || ''));
      setTestResult(null);
      setShowKey(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleTest() {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Introduce una clave de API.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      await testGeminiApiKey(apiKey);
      setTestResult({ success: true, message: '¡Clave de API válida!' });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Error al verificar.' });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await setGeminiApiKey(apiKey);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setTestResult({ success: false, message: 'Error al guardar.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (window.confirm('¿Eliminar la clave guardada?')) {
      await removeGeminiApiKey();
      setApiKey('');
      setTestResult({ success: true, message: 'Clave eliminada.' });
      if (onSaved) onSaved();
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border-2 border-sky-100">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl"><Key className="w-7 h-7" /></div>
            <h3 className="text-2xl font-black">Clave API Gemini</h3>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-100 rounded-2xl min-h-[48px] min-w-[48px] flex items-center justify-center"><X className="w-6 h-6" /></button>
        </div>
        <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 text-sm font-medium text-slate-700 flex items-start space-x-3">
          <Shield className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
          <p>Tu clave se guarda <strong>únicamente en tu dispositivo</strong> (IndexedDB).</p>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="font-bold block mb-2">Clave de API</label>
            <div className="relative flex items-center">
              <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIzaSy..." className="w-full text-lg font-mono p-4 pr-14 bg-slate-50 border-2 border-slate-300 rounded-2xl min-h-[56px]" />
              <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"><Eye className="w-6 h-6 text-slate-500" /></button>
            </div>
          </div>
          {testResult && (
            <div className={`p-4 rounded-2xl font-bold flex items-center space-x-3 ${testResult.success ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
              {testResult.success ? <Check className="w-6 h-6 text-emerald-700" /> : <AlertCircle className="w-6 h-6 text-rose-700" />}
              <div>{testResult.message}</div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleTest} disabled={testing || !apiKey.trim()} className="flex-1 py-4 bg-sky-100 text-sky-800 font-bold rounded-2xl min-h-[52px]">
              {testing ? 'Probando...' : 'Probar'}
            </button>
            {apiKey && (
              <button type="button" onClick={handleRemove} className="py-4 px-6 bg-rose-50 text-rose-700 font-bold rounded-2xl min-h-[52px] flex items-center justify-center space-x-2">
                <Trash2 className="w-5 h-5" /><span>Borrar</span>
              </button>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-6 py-4 bg-slate-200 font-bold rounded-2xl min-h-[52px]">Cancelar</button>
            <button type="submit" disabled={loading} className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg min-h-[52px]">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
