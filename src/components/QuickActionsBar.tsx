import React, { useRef } from 'react';
import { FileText, Share2, Download, Upload } from 'lucide-react';

export interface QuickActionsBarProps {
  hasReadings: boolean;
  onExportPDF: () => void;
  onShare: () => void;
  onExportBackup: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  hasReadings,
  onExportPDF,
  onShare,
  onExportBackup,
  onImportJson,
  fileInputRef,
}) => {
  const localRef = useRef<HTMLInputElement>(null);
  const activeFileInputRef = fileInputRef || localRef;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button
        onClick={onExportPDF}
        disabled={!hasReadings}
        className="bg-white p-3 rounded-2xl border-2 border-sky-200 font-bold text-sky-900 flex flex-col items-center disabled:opacity-50 min-h-[56px]"
      >
        <FileText className="w-6 h-6 text-sky-700 mb-1" />
        PDF
      </button>
      <button
        onClick={onShare}
        disabled={!hasReadings}
        className="bg-white p-3 rounded-2xl border-2 border-sky-200 font-bold text-sky-900 flex flex-col items-center disabled:opacity-50 min-h-[56px]"
      >
        <Share2 className="w-6 h-6 text-sky-700 mb-1" />
        Compartir
      </button>
      <button
        onClick={onExportBackup}
        disabled={!hasReadings}
        className="bg-white p-3 rounded-2xl border-2 border-sky-200 font-bold text-sky-900 flex flex-col items-center disabled:opacity-50 min-h-[56px]"
      >
        <Download className="w-6 h-6 text-sky-700 mb-1" />
        Backup
      </button>
      <div className="relative flex flex-col items-center">
        <input
          type="file"
          accept=".json,application/json"
          ref={activeFileInputRef}
          onChange={onImportJson}
          className="hidden"
        />
        <button
          onClick={() => activeFileInputRef.current?.click()}
          className="w-full h-full bg-white p-3 rounded-2xl border-2 border-sky-200 font-bold text-sky-900 flex flex-col items-center justify-center hover:bg-sky-50 min-h-[56px] cursor-pointer shadow-sm"
        >
          <Upload className="w-6 h-6 text-sky-700 mb-1" />
          Importar
        </button>
      </div>
    </div>
  );
};

export default QuickActionsBar;

