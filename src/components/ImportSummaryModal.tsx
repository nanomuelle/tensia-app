import React from 'react';
import { X } from 'lucide-react';
import type { ImportAnalysisResult } from '../services/readingsService';

export interface ImportSummaryModalProps {
  isOpen: boolean;
  importAnalysis: ImportAnalysisResult | null;
  isImporting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ImportSummaryModal: React.FC<ImportSummaryModalProps> = ({
  isOpen,
  importAnalysis,
  isImporting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !importAnalysis) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-2xl font-black text-slate-800">
            Resumen de Importación
          </h3>
          <button
            onClick={onClose}
            className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-slate-600 text-base">
            Se ha analizado el archivo de copia de seguridad. Revise el resumen
            antes de fusionar los datos en la base de datos:
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-sky-50 border-2 border-sky-200 p-4 rounded-2xl text-center">
              <span className="block text-3xl font-black text-sky-900">
                {importAnalysis.newValidRecords.length}
              </span>
              <span className="text-sm font-bold text-sky-700">
                Nuevas a importar
              </span>
            </div>
            <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl text-center">
              <span className="block text-3xl font-black text-slate-700">
                {importAnalysis.duplicatesCount}
              </span>
              <span className="text-sm font-bold text-slate-500">
                Duplicados omitidos
              </span>
            </div>
          </div>

          {importAnalysis.invalidCount > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-amber-900">
                Registros inválidos descartados:
              </span>
              <span className="text-xl font-black text-amber-800">
                {importAnalysis.invalidCount}
              </span>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-600 space-y-1">
            <p>
              • Total en el fichero: <strong>{importAnalysis.totalInFile}</strong>
            </p>
            <p>
              • Los duplicados exactos y registros inválidos no sobrescribirán ni
              afectarán a sus datos existentes.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 font-bold rounded-2xl min-h-[48px]"
            disabled={isImporting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isImporting || importAnalysis.newValidRecords.length === 0}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow min-h-[48px]"
          >
            {isImporting ? 'Importando...' : 'Confirmar e Importar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportSummaryModal;
