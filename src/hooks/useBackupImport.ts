import { useState, useRef, useCallback } from 'react';
import {
  exportDatabaseToJson,
  analyzeJsonImport,
  persistImportedRecords,
  ImportAnalysisResult,
} from '../services/readingsService';

export function useBackupImport() {
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysisResult | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportJson = useCallback(async () => {
    const jsonStr = await exportDatabaseToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Tensia-Backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImportJson = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  const confirmAndExecuteImport = useCallback(
    async (callbacks?: {
      onSuccess?: (addedCount: number) => void | Promise<void>;
      onError?: (err: any) => void;
    }) => {
      if (!importAnalysis || importAnalysis.newValidRecords.length === 0) {
        setIsImportModalOpen(false);
        return;
      }
      setIsImporting(true);
      try {
        const addedCount = await persistImportedRecords(importAnalysis.newValidRecords);
        if (callbacks?.onSuccess) {
          await callbacks.onSuccess(addedCount);
        }
      } catch (err: any) {
        if (callbacks?.onError) {
          callbacks.onError(err);
        } else {
          alert(err.message || 'Error al guardar las lecturas importadas.');
        }
      } finally {
        setIsImporting(false);
        setIsImportModalOpen(false);
        setImportAnalysis(null);
      }
    },
    [importAnalysis]
  );

  const closeImportModal = useCallback(() => {
    setIsImportModalOpen(false);
    setImportAnalysis(null);
  }, []);

  return {
    importAnalysis,
    setImportAnalysis,
    isImportModalOpen,
    setIsImportModalOpen,
    isImporting,
    fileInputRef,
    handleExportJson,
    handleImportJson,
    confirmAndExecuteImport,
    closeImportModal,
  };
}

export default useBackupImport;
