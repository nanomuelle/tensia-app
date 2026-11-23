import React from 'react';
import { ClipboardList, FileText, Share2, Download } from 'lucide-react';

export interface QuickActionsBarProps {
  hasReadings: boolean;
  onExportPDF: () => void;
  onShare: () => void;
  onExportBackup: () => void;
  onOpenAmpa: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  hasReadings,
  onExportPDF,
  onShare,
  onExportBackup,
  onOpenAmpa,
}) => {
  return (
    <div role="group" aria-label="Accesos directos" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button
        onClick={onOpenAmpa}
        className="bg-white p-3 rounded-2xl border-2 border-sky-200 font-bold text-sky-900 flex flex-col items-center min-h-[56px]"
      >
        <ClipboardList className="w-6 h-6 text-sky-700 mb-1" />
        Registro AMPA
      </button>
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
    </div>
  );
};

export default QuickActionsBar;

