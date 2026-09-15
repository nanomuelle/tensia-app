import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, FileText, Share2, Download, Upload } from 'lucide-react';

export interface UtilitiesMenuProps {
  hasReadings: boolean;
  onExportPDF: () => void;
  onShare: () => void;
  onExportBackup: () => void;
  onImportClick: () => void;
}

export const UtilitiesMenu: React.FC<UtilitiesMenuProps> = ({
  hasReadings,
  onExportPDF,
  onShare,
  onExportBackup,
  onImportClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-sky-600 hover:bg-sky-800 text-white font-bold p-2.5 rounded-2xl flex items-center justify-center min-h-[48px] min-w-[48px] shadow"
        title="Más opciones (Herramientas auxiliares)"
        aria-label="Más opciones"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-sky-100 py-2 z-30 text-slate-800">
          <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            Más opciones
          </div>
          <button
            onClick={() => {
              onExportPDF();
              setIsOpen(false);
            }}
            disabled={!hasReadings}
            className="w-full text-left px-4 py-3 hover:bg-sky-50 flex items-space-between items-center space-x-3 text-slate-700 font-semibold disabled:opacity-40 min-h-[44px]"
          >
            <FileText className="w-5 h-5 text-sky-600" />
            <span>Exportar PDF</span>
          </button>
          <button
            onClick={() => {
              onShare();
              setIsOpen(false);
            }}
            disabled={!hasReadings}
            className="w-full text-left px-4 py-3 hover:bg-sky-50 flex items-center space-x-3 text-slate-700 font-semibold disabled:opacity-40 min-h-[44px]"
          >
            <Share2 className="w-5 h-5 text-sky-600" />
            <span>Compartir Historial</span>
          </button>
          <button
            onClick={() => {
              onExportBackup();
              setIsOpen(false);
            }}
            disabled={!hasReadings}
            className="w-full text-left px-4 py-3 hover:bg-sky-50 flex items-center space-x-3 text-slate-700 font-semibold disabled:opacity-40 min-h-[44px]"
          >
            <Download className="w-5 h-5 text-sky-600" />
            <span>Backup (Exportar JSON)</span>
          </button>
          <button
            onClick={() => {
              onImportClick();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-3 hover:bg-sky-50 flex items-center space-x-3 text-slate-700 font-semibold min-h-[44px]"
          >
            <Upload className="w-5 h-5 text-sky-600" />
            <span>Importar JSON</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UtilitiesMenu;

