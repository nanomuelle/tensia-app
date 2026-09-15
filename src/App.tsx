import React, { useState } from 'react';
import { Plus, CheckCircle2, Activity, Key, Camera, Loader2 } from 'lucide-react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { PrivacyModal } from './components/PrivacyModal';
import { PhotoCaptureModal } from './components/PhotoCaptureModal';
import { ReadingsHistory } from './components/ReadingsHistory';
import { StorageBanner } from './components/StorageBanner';
import { UtilitiesMenu } from './components/UtilitiesMenu';
import { QuickActionsBar } from './components/QuickActionsBar';
import { ReadingModal } from './components/ReadingModal';
import { ImportSummaryModal } from './components/ImportSummaryModal';

import { useReadings } from './hooks/useReadings';
import { useStoragePersistence } from './hooks/useStoragePersistence';
import { useApiKey } from './hooks/useApiKey';
import { useBackupImport } from './hooks/useBackupImport';
import { useGeminiAI } from './hooks/useGeminiAI';

import {
  BloodPressureRecord,
  validateReading,
} from './services/readingsService';
import { generateReadingsPDF } from './services/pdfService';

export default function App() {
  const {
    readings,
    loadReadings,
    addReading,
    updateReading,
    deleteReading,
  } = useReadings();

  const {
    isPersistent,
    isRequestingPersistence,
    persistenceMessage,
    isStorageDismissed,
    handleRequestPersistence,
    dismissBanner,
  } = useStoragePersistence();

  const {
    isApiKeyModalOpen,
    openApiKeyModal,
    closeApiKeyModal,
  } = useApiKey();

  const {
    importAnalysis,
    isImportModalOpen,
    isImporting,
    fileInputRef,
    handleExportJson,
    handleImportJson,
    confirmAndExecuteImport: executeImport,
    closeImportModal,
  } = useBackupImport();

  const {
    isPrivacyModalOpen,
    isPhotoModalOpen,
    isAnalyzingPhoto,
    handlePhotoAndListClick: photoAndListClick,
    handlePrivacyAccepted,
    handleImageSelected: processImageSelected,
    closePrivacyModal,
    closePhotoModal,
  } = useGeminiAI();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('70');
  const [timestamp, setTimestamp] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handlePhotoAndListClick() {
    await photoAndListClick(openApiKeyModal);
  }

  async function handleImageSelected(fileOrBlob: File | Blob) {
    await processImageSelected(fileOrBlob, {
      onResult: (result) => {
        setEditingId(null);
        setSystolic(result.systolic.toString());
        setDiastolic(result.diastolic.toString());
        setPulse(result.pulse.toString());
        setTimestamp(toLocalDateTimeString(new Date()));
        setNotes('Capturado con foto y Gemini AI');
        setErrorMsg(null);
        setIsModalOpen(true);
      },
      onRequireApiKey: openApiKeyModal,
      onError: (msg) => {
        setErrorMsg(msg);
        setIsModalOpen(true);
      },
    });
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
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleDelete(id: number) {
    if (window.confirm('¿Eliminar esta medición?')) {
      await deleteReading(id);
      setSuccessMsg('Medición eliminada.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  }

  async function confirmAndExecuteImport() {
    await executeImport({
      onSuccess: async (addedCount) => {
        setSuccessMsg(`¡Se han importado ${addedCount} lecturas nuevas con éxito!`);
        await loadReadings();
        setTimeout(() => setSuccessMsg(null), 4000);
      },
      onError: (err) => {
        setErrorMsg(err.message || 'Error al guardar las lecturas importadas.');
        setTimeout(() => setErrorMsg(null), 4000);
      },
    });
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
              onClick={openApiKeyModal} 
              className="bg-sky-600 hover:bg-sky-800 text-white font-bold p-2.5 rounded-2xl flex items-center justify-center min-h-[48px] min-w-[48px] shadow"
              title="Configurar Clave API de Gemini"
              aria-label="Configurar Clave API de Gemini"
            >
              <Key className="w-5 h-5" />
            </button>
            <UtilitiesMenu
              hasReadings={readings.length > 0}
              onExportPDF={() => generateReadingsPDF(readings)}
              onShare={handleShare}
              onExportBackup={handleExportJson}
              onImportClick={() => fileInputRef.current?.click()}
            />
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {successMsg && <div className="bg-emerald-100 text-emerald-900 p-3 rounded-xl font-bold flex items-center space-x-2"><CheckCircle2 className="w-6 h-6"/><span>{successMsg}</span></div>}
        <StorageBanner
          isPersistent={isPersistent}
          isStorageDismissed={isStorageDismissed}
          isRequestingPersistence={isRequestingPersistence}
          persistenceMessage={persistenceMessage}
          onRequestPersistence={handleRequestPersistence}
          onDismiss={dismissBanner}
        />
        <QuickActionsBar
          hasReadings={readings.length > 0}
          onExportPDF={() => generateReadingsPDF(readings)}
          onShare={handleShare}
          onExportBackup={handleExportJson}
          onImportJson={handleImportJson}
          fileInputRef={fileInputRef}
        />
        <div className="pt-3"></div>
        <ReadingsHistory
          readings={readings}
          onEdit={handleOpenEditModal}
          onDelete={handleDelete}
          onAddNew={handleOpenNewModal}
        />
      </main>
      <ReadingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingId={editingId}
        systolic={systolic}
        diastolic={diastolic}
        pulse={pulse}
        timestamp={timestamp}
        notes={notes}
        errorMsg={errorMsg}
        setSystolic={setSystolic}
        setDiastolic={setDiastolic}
        setPulse={setPulse}
        setTimestamp={setTimestamp}
        setNotes={setNotes}
        onSave={handleSave}
      />
      <ImportSummaryModal
        isOpen={isImportModalOpen}
        importAnalysis={importAnalysis}
        isImporting={isImporting}
        onClose={closeImportModal}
        onConfirm={confirmAndExecuteImport}
      />

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={closeApiKeyModal} 
        onSaved={() => setSuccessMsg('¡Clave de API guardada correctamente!')}
      />
      <PrivacyModal 
        isOpen={isPrivacyModalOpen} 
        onAccept={handlePrivacyAccepted} 
        onCancel={closePrivacyModal} 
      />
      <PhotoCaptureModal 
        isOpen={isPhotoModalOpen} 
        onClose={closePhotoModal} 
        onImageSelected={handleImageSelected} 
      />
    </div>
  );
}
