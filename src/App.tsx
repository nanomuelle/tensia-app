import React, { useState, useEffect, useRef } from 'react';
import { Plus, Heart, Calendar, FileText, Download, Upload, Share2, Trash2, Edit2, CheckCircle2, X, Activity, MoreVertical, Key, Camera, Loader2 } from 'lucide-react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { PrivacyModal } from './components/PrivacyModal';
import { PhotoCaptureModal } from './components/PhotoCaptureModal';
import { getGeminiApiKey } from './services/settingsService';
import { compressImage, analyzeBloodPressureImage } from './services/geminiService';

import {
  BloodPressureRecord,
  getAllReadings,
  addReading,
  updateReading,
  deleteReading,
  exportDatabaseToJson,
  analyzeJsonImport,
  persistImportedRecords,
  ImportAnalysisResult,
  getCategory,
  validateReading,
} from './services/readingsService';
import { generateReadingsPDF } from './services/pdfService';

export default function App() {
  const [readings, setReadings] = useState<BloodPressureRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('70');
  const [timestamp, setTimestamp] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPersistent, setIsPersistent] = useState<boolean | null>(null);
  const [isRequestingPersistence, setIsRequestingPersistence] = useState(false);
  const [persistenceMessage, setPersistenceMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysisResult | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isStorageDismissed, setIsStorageDismissed] = useState(() => localStorage.getItem('tensia_dismiss_persistence_banner') === 'true');
  const utilitiesMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (utilitiesMenuRef.current && !utilitiesMenuRef.current.contains(event.target as Node)) {
        setIsUtilitiesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handlePhotoAndListClick() {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }
    const privacyAccepted = localStorage.getItem('tensia_privacy_accepted');
    if (!privacyAccepted) {
      setIsPrivacyModalOpen(true);
      return;
    }
    setIsPhotoModalOpen(true);
  }

  function handlePrivacyAccepted() {
    localStorage.setItem('tensia_privacy_accepted', 'true');
    setIsPrivacyModalOpen(false);
    setIsPhotoModalOpen(true);
  }

  async function handleImageSelected(fileOrBlob: File | Blob) {
    setIsAnalyzingPhoto(true);
    setAnalysisError(null);
    try {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        setIsApiKeyModalOpen(true);
        setIsAnalyzingPhoto(false);
        return;
      }
      const compressedBase64 = await compressImage(fileOrBlob);
      const result = await analyzeBloodPressureImage(apiKey, compressedBase64);
      
      setEditingId(null);
      setSystolic(result.systolic.toString());
      setDiastolic(result.diastolic.toString());
      setPulse(result.pulse.toString());
      setTimestamp(toLocalDateTimeString(new Date()));
      setNotes('Capturado con foto y Gemini AI');
      setErrorMsg(null);
      setIsModalOpen(true);
    } catch (err: any) {
      setAnalysisError(err.message || 'Error al analizar la imagen con Gemini.');
      setErrorMsg(err.message || 'Error al analizar la imagen con Gemini.');
      setIsModalOpen(true);
    } finally {
      setIsAnalyzingPhoto(false);
    }
  }


  useEffect(() => {
    loadData();
    if (navigator.storage?.persisted) {
      navigator.storage.persisted().then(setIsPersistent).catch(() => {});
    }
  }, []);

  async function handleRequestPersistence() {
    setIsRequestingPersistence(true);
    setPersistenceMessage(null);
    try {
      if (!navigator.storage?.persist) {
        setPersistenceMessage({
          text: 'La función de almacenamiento persistente no es compatible con este navegador.',
          type: 'info'
        });
        setIsRequestingPersistence(false);
        return;
      }
      const granted = await navigator.storage.persist();
      setIsPersistent(granted);
      if (granted) {
        setPersistenceMessage({
          text: 'El almacenamiento persistente está activado correctamente.',
          type: 'success'
        });
      } else {
        setPersistenceMessage({
          text: 'El navegador rechazó la solicitud de almacenamiento persistente. Sus lecturas siguen guardándose localmente, pero podrían eliminarse si el navegador necesita liberar espacio.',
          type: 'warning'
        });
      }
    } catch (err) {
      setPersistenceMessage({
        text: 'No se pudo completar la solicitud de almacenamiento persistente.',
        type: 'error'
      });
    } finally {
      setIsRequestingPersistence(false);
    }
  }

  async function loadData() {
    setReadings(await getAllReadings());
  }

  function toLocalDateTimeString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function handleOpenNewModal() {
    setEditingId(null);
    setSystolic('120');
    setDiastolic('80');
    setPulse('70');
    setTimestamp(toLocalDateTimeString(new Date()));
    setNotes('');
    setErrorMsg(null);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(r: BloodPressureRecord) {
    if (!r.id) return;
    setEditingId(r.id);
    setSystolic(r.systolic.toString());
    setDiastolic(r.diastolic.toString());
    setPulse(r.pulse.toString());
    setTimestamp(toLocalDateTimeString(new Date(r.timestamp)));
    setNotes(r.notes || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    const pul = parseInt(pulse, 10);

    const validation = validateReading(sys, dia, pul);
    if (!validation.isValid) {
      setErrorMsg(validation.error!);
      return;
    }

    const isoDate = new Date(timestamp).toISOString();
    if (editingId) {
      await updateReading(editingId, { systolic: sys, diastolic: dia, pulse: pul, timestamp: isoDate, notes: notes.trim() || undefined });
      setSuccessMsg('¡Medición actualizada!');
    } else {
      await addReading({ systolic: sys, diastolic: dia, pulse: pul, timestamp: isoDate, notes: notes.trim() || undefined });
      setSuccessMsg('¡Medición guardada!');
    }
    setIsModalOpen(false);
    loadData();
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleDelete(id: number) {
    if (window.confirm('¿Eliminar esta medición?')) {
      await deleteReading(id);
      setSuccessMsg('Medición eliminada.');
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  }

  async function handleExportJson() {
    const jsonStr = await exportDatabaseToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tensia-Backup.json`;
    a.click();
  }

  async function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const analysis = await analyzeJsonImport(text);
        setImportAnalysis(analysis);
        setIsImportModalOpen(true);
      } catch (err: any) {
        alert(err.message || 'Error al procesar el archivo JSON.');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      alert('Error al leer el archivo.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  }

  async function confirmAndExecuteImport() {
    if (!importAnalysis || importAnalysis.newValidRecords.length === 0) {
      setIsImportModalOpen(false);
      return;
    }
    setIsImporting(true);
    try {
      const addedCount = await persistImportedRecords(importAnalysis.newValidRecords);
      setSuccessMsg(`¡Se han importado ${addedCount} lecturas nuevas con éxito!`);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar las lecturas importadas.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsImporting(false);
      setIsImportModalOpen(false);
      setImportAnalysis(null);
    }
  }

  async function handleShare() {
    const summary = readings.slice(0, 5).map(r => `${new Date(r.timestamp).toLocaleDateString()} (${r.period}): ${r.systolic}/${r.diastolic} mmHg`).join('\n');
    const text = `Tensión Arterial (Tensia):\n${summary}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Tensia', text }); } catch (e) {}
    } else {
      window.location.href = `mailto:?subject=Tensión&body=${encodeURIComponent(text)}`;
    }
  }

  const grouped: { [key: string]: BloodPressureRecord[] } = {};
  readings.forEach(r => {
    const key = new Date(r.timestamp).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  return (
    <div className="min-h-screen bg-sky-50 pb-16">
      <header className="bg-sky-700 text-white shadow-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8" />
            <h1 className="text-2xl font-black">Tensia</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePhotoAndListClick} 
              disabled={isAnalyzingPhoto}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-3.5 py-2.5 rounded-2xl flex items-center space-x-2 text-base min-h-[48px] shadow"
              title="Foto y listo"
            >
              {isAnalyzingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              <span className="hidden sm:inline">{isAnalyzingPhoto ? 'Analizando...' : 'Foto y listo'}</span>
            </button>
            <button 
              onClick={handleOpenNewModal} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-2xl flex items-center space-x-2 text-base min-h-[48px] shadow"
              title="Nueva Toma"
            >
              <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Nueva Toma</span>
            </button>
            <button 
              onClick={() => setIsApiKeyModalOpen(true)} 
              className="bg-sky-600 hover:bg-sky-800 text-white font-bold p-2.5 rounded-2xl flex items-center justify-center min-h-[48px] min-w-[48px] shadow"
              title="Configurar Clave API de Gemini"
              aria-label="Configurar Clave API de Gemini"
            >
              <Key className="w-5 h-5" />
            </button>
            <div className="relative" ref={utilitiesMenuRef}>
              <button 
                onClick={() => setIsUtilitiesOpen(!isUtilitiesOpen)} 
                className="bg-sky-600 hover:bg-sky-800 text-white font-bold p-2.5 rounded-2xl flex items-center justify-center min-h-[48px] min-w-[48px] shadow"
                title="Más opciones (Herramientas auxiliares)"
                aria-label="Más opciones"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {isUtilitiesOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-sky-100 py-2 z-30 text-slate-800">
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Más opciones</div>
                  <button 
                    onClick={() => { generateReadingsPDF(readings); setIsUtilitiesOpen(false); }} 
                    disabled={!readings.length}
                    className="w-full text-left px-4 py-3 hover:bg-sky-50 flex items-space-between items-center space-x-3 text-slate-700 font-semibold disabled:opacity-40 min-h-[44px]"
                  >
                    <FileText className="w-5 h-5 text-sky-600"/><span>Exportar PDF</span>
                  </button>
                  <button 
                    onClick={() => { handleShare(); setIsUtilitiesOpen(false); }} 
                    disabled={!readings.length}
                    className="w-full text-left px-4 py-3 hover:bg-sky-50 flex items-center space-x-3 text-slate-700 font-semibold disabled:opacity-40 min-h-[44px]"
                  >
                    <Share2 className="w-5 h-5 text-sky-600"/><span>Compartir Historial</span>
                  </button>
                  <button 
                    onClick={() => { handleExportJson(); setIsUtilitiesOpen(false); }} 
                    disabled={!readings.length}
                    className="w-full text-left px-4 py-3 hover:bg-sky-50 flex items-center space-x-3 text-slate-700 font-semibold disabled:opacity-40 min-h-[44px]"
                  >
                    <Download className="w-5 h-5 text-sky-600"/><span>Backup (Exportar JSON)</span>
                  </button>
                  <button 
                    onClick={() => { fileInputRef.current?.click(); setIsUtilitiesOpen(false); }} 
                    className="w-full text-left px-4 py-3 hover:bg-sky-50 flex items-center space-x-3 text-slate-700 font-semibold min-h-[44px]"
                  >
                    <Upload className="w-5 h-5 text-sky-600"/><span>Importar JSON</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {successMsg && <div className="bg-emerald-100 text-emerald-900 p-3 rounded-xl font-bold flex items-center space-x-2"><CheckCircle2 className="w-6 h-6"/><span>{successMsg}</span></div>}
        {isPersistent === false && !isStorageDismissed && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-sm" role="status">
            <div className="flex items-center space-x-3">
              <span className="text-xl">💡</span>
              <div>
                <span className="font-bold text-sm block">Almacenamiento local protegido</span>
                <p className="text-xs text-amber-800">Active el almacenamiento persistente para evitar la pérdida de datos del navegador.</p>
                {persistenceMessage && (
                  <p className="text-xs mt-1 text-amber-900 font-semibold">{persistenceMessage.text}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleRequestPersistence} 
                disabled={isRequestingPersistence}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-xl text-xs min-h-[38px] whitespace-nowrap shadow"
              >
                {isRequestingPersistence ? 'Activando...' : 'Activar'}
              </button>
              <button 
                onClick={() => {
                  setIsStorageDismissed(true);
                  localStorage.setItem('tensia_dismiss_persistence_banner', 'true');
                }}
                className="text-amber-700 hover:text-amber-900 p-2 rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Cerrar aviso"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>
          </div>
        )}
        {isPersistent === true && persistenceMessage && (
          <div className="bg-emerald-100 text-emerald-900 p-4 rounded-xl shadow" role="status">
            <p className="font-bold">{persistenceMessage.text}</p>
          </div>
        )}
        {persistenceMessage && isPersistent !== false && isPersistent !== true && (
          <div className="bg-slate-100 text-slate-900 p-4 rounded-xl shadow" role="status">
            <p className="font-bold">{persistenceMessage.text}</p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => generateReadingsPDF(readings)} disabled={!readings.length} className="bg-white p-3 rounded-2xl border-2 border-sky-200 font-bold text-sky-900 flex flex-col items-center disabled:opacity-50 min-h-[56px]"><FileText className="w-6 h-6 text-sky-700 mb-1"/>PDF</button>
          <button onClick={handleShare} disabled={!readings.length} className="bg-white p-3 rounded-2xl border-2 border-sky-200 font-bold text-sky-900 flex flex-col items-center disabled:opacity-50 min-h-[56px]"><Share2 className="w-6 h-6 text-sky-700 mb-1"/>Compartir</button>
          <button onClick={handleExportJson} disabled={!readings.length} className="bg-white p-3 rounded-2xl border-2 border-sky-200 font-bold text-sky-900 flex flex-col items-center disabled:opacity-50 min-h-[56px]"><Download className="w-6 h-6 text-sky-700 mb-1"/>Backup</button>
          <div className="relative flex flex-col items-center">
            <input 
              type="file" 
              accept=".json,application/json" 
              ref={fileInputRef} 
              onChange={handleImportJson} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full h-full bg-white p-3 rounded-2xl border-2 border-sky-200 font-bold text-sky-900 flex flex-col items-center justify-center hover:bg-sky-50 min-h-[56px] cursor-pointer shadow-sm"
            >
              <Upload className="w-6 h-6 text-sky-700 mb-1"/>Importar
            </button>
          </div>
        </div>
        <div className="pt-3"></div>
        <section className="space-y-4 pt-2">
          <h2 className="text-2xl font-extrabold text-slate-800">Historial</h2>
          {!readings.length ? (
            <div className="bg-white border-2 border-dashed border-sky-200 rounded-3xl p-10 text-center space-y-3">
              <Heart className="w-12 h-12 text-sky-700 mx-auto"/>
              <p className="text-slate-600 text-lg">No hay tomas registradas.</p>
              <button onClick={handleOpenNewModal} className="bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl min-h-[48px]">Registrar Toma</button>
            </div>
          ) : (
            Object.entries(grouped).map(([date, list]) => {
              const morning = list.filter(r => r.period === 'Mañana');
              const afternoonNight = list.filter(r => r.period === 'Tarde' || r.period === 'Noche');
              const sortedRev = [...list].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

              return (
                <div key={date} className="bg-white border-2 border-sky-100 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-sky-900 bg-sky-100 px-4 py-2 rounded-xl">{date}</h3>
                  <div className="hidden md:grid md:grid-cols-2 gap-4">
                    <div className="space-y-3 bg-sky-50/50 p-4 rounded-2xl border border-sky-100">
                      <div className="font-bold text-sky-900 text-sm border-b border-sky-200 pb-2">🌅 Mañana (06:00–11:59)</div>
                      {!morning.length ? <p className="text-xs text-slate-400 italic py-2">Sin lecturas en la mañana</p> : morning.map(r => {
                        const cat = getCategory(r.systolic, r.diastolic);
                        return (
                          <div key={r.id} className="bg-white border border-sky-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-baseline space-x-2">
                                <span className="text-xl font-black">{r.systolic}/{r.diastolic}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${cat.color}`}>{cat.label}</span>
                              </div>
                              <p className="text-xs text-slate-600">🕒 {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Pulso: {r.pulse} lpm</p>
                            </div>
                            <div className="flex space-x-1">
                              <button onClick={() => handleOpenEditModal(r)} className="p-2 bg-sky-50 text-sky-700 rounded-xl"><Edit2 className="w-4 h-4"/></button>
                              <button onClick={() => r.id && handleDelete(r.id)} className="p-2 bg-rose-50 text-rose-700 rounded-xl"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-100">
                      <div className="font-bold text-amber-900 text-sm border-b border-amber-200 pb-2">🌇 Tarde & Noche (12:00–05:59)</div>
                      {!afternoonNight.length ? <p className="text-xs text-slate-400 italic py-2">Sin lecturas en tarde/noche</p> : afternoonNight.map(r => {
                        const cat = getCategory(r.systolic, r.diastolic);
                        return (
                          <div key={r.id} className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-baseline space-x-2">
                                <span className="text-xl font-black">{r.systolic}/{r.diastolic}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${cat.color}`}>{cat.label}</span>
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">{r.period}</span>
                              </div>
                              <p className="text-xs text-slate-600">🕒 {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Pulso: {r.pulse} lpm</p>
                            </div>
                            <div className="flex space-x-1">
                              <button onClick={() => handleOpenEditModal(r)} className="p-2 bg-sky-50 text-sky-700 rounded-xl"><Edit2 className="w-4 h-4"/></button>
                              <button onClick={() => r.id && handleDelete(r.id)} className="p-2 bg-rose-50 text-rose-700 rounded-xl"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="md:hidden space-y-3">
                    {sortedRev.map(r => {
                      const cat = getCategory(r.systolic, r.diastolic);
                      return (
                        <div key={r.id} className="bg-white border border-sky-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-baseline space-x-2">
                              <span className="text-2xl font-black">{r.systolic}/{r.diastolic}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${cat.color}`}>{cat.label}</span>
                              <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded">{r.period}</span>
                            </div>
                            <p className="text-xs text-slate-600">🕒 {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Pulso: {r.pulse} lpm</p>
                          </div>
                          <div className="flex space-x-1">
                            <button onClick={() => handleOpenEditModal(r)} className="p-2 bg-sky-50 text-sky-700 rounded-xl"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={() => r.id && handleDelete(r.id)} className="p-2 bg-rose-50 text-rose-700 rounded-xl"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-2xl font-black">{editingId ? 'Editar' : 'Nueva Toma'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center"><X className="w-6 h-6"/></button>
            </div>
            {errorMsg && <div className="bg-rose-100 text-rose-900 p-3 rounded-xl font-bold">{errorMsg}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold block mb-1">Sistólica</label>
                  <input type="number" min="40" max="250" value={systolic} onChange={e => setSystolic(e.target.value)} className="w-full text-3xl font-black p-3 bg-sky-50 border-2 rounded-2xl text-center min-h-[56px]" required />
                </div>
                <div>
                  <label className="font-bold block mb-1">Diastólica</label>
                  <input type="number" min="20" max="160" value={diastolic} onChange={e => setDiastolic(e.target.value)} className="w-full text-3xl font-black p-3 bg-sky-50 border-2 rounded-2xl text-center min-h-[56px]" required />
                </div>
              </div>
              <div>
                <label className="font-bold block nis-1">Pulso</label>
                <input type="number" min="10" max="250" value={pulse} onChange={e => setPulse(e.target.value)} className="w-full text-2xl font-bold p-3 bg-sky-50 border-2 rounded-2xl text-center min-h-[52px]" required />
              </div>
              <div>
                <label className="font-bold block mb-1">Fecha y Hora</label>
                <input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} className="w-full text-lg font-bold p-3 bg-sky-50 border-2 rounded-2xl min-h-[52px]" required />
              </div>
              <div>
                <label className="font-bold block mb-1">Notas</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 bg-sky-50 border-2 rounded-2xl" />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-slate-200 font-bold rounded-2xl min-h-[48px]">Cancelar</button>
                <button type="submit" className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow min-h-[48px]">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isImportModalOpen && importAnalysis && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-2xl font-black text-slate-800">Resumen de Importación</h3>
              <button onClick={() => { setIsImportModalOpen(false); setImportAnalysis(null); }} className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center"><X className="w-6 h-6"/></button>
            </div>
            
            <div className="space-y-4">
              <p className="text-slate-600 text-base">
                Se ha analizado el archivo de copia de seguridad. Revise el resumen antes de fusionar los datos en la base de datos:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sky-50 border-2 border-sky-200 p-4 rounded-2xl text-center">
                  <span className="block text-3xl font-black text-sky-900">{importAnalysis.newValidRecords.length}</span>
                  <span className="text-sm font-bold text-sky-700">Nuevas a importar</span>
                </div>
                <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl text-center">
                  <span className="block text-3xl font-black text-slate-700">{importAnalysis.duplicatesCount}</span>
                  <span className="text-sm font-bold text-slate-500">Duplicados omitidos</span>
                </div>
              </div>

              {importAnalysis.invalidCount > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-center justify-between">
                  <span className="font-bold text-amber-900">Registros inválidos descartados:</span>
                  <span className="text-xl font-black text-amber-800">{importAnalysis.invalidCount}</span>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-600 space-y-1">
                <p>• Total en el fichero: <strong>{importAnalysis.totalInFile}</strong></p>
                <p>• Los duplicados exactos y registros inválidos no sobrescribirán ni afectarán a sus datos existentes.</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => { setIsImportModalOpen(false); setImportAnalysis(null); }} 
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 font-bold rounded-2xl min-h-[48px]"
                disabled={isImporting}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={confirmAndExecuteImport} 
                disabled={isImporting || importAnalysis.newValidRecords.length === 0}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow min-h-[48px]"
              >
                {isImporting ? 'Importando...' : 'Confirmar e Importar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)} 
        onSaved={() => setSuccessMsg('¡Clave de API guardada correctamente!')}
      />
      <PrivacyModal 
        isOpen={isPrivacyModalOpen} 
        onAccept={handlePrivacyAccepted} 
        onCancel={() => setIsPrivacyModalOpen(false)} 
      />
      <PhotoCaptureModal 
        isOpen={isPhotoModalOpen} 
        onClose={() => setIsPhotoModalOpen(false)} 
        onImageSelected={handleImageSelected} 
      />
    </div>
  );
}
