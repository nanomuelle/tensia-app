import React from 'react';
import { X } from 'lucide-react';
import type { PersistenceMessage } from '../hooks/useStoragePersistence';

export interface StorageBannerProps {
  isPersistent: boolean | null;
  isStorageDismissed: boolean;
  isRequestingPersistence: boolean;
  persistenceMessage: PersistenceMessage | null;
  onRequestPersistence: () => void;
  onDismiss: () => void;
}

export const StorageBanner: React.FC<StorageBannerProps> = ({
  isPersistent,
  isStorageDismissed,
  isRequestingPersistence,
  persistenceMessage,
  onRequestPersistence,
  onDismiss,
}) => {
  return (
    <>
      {isPersistent === false && !isStorageDismissed && (
        <div
          className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
          role="status"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">💡</span>
            <div>
              <span className="font-bold text-sm block">
                Almacenamiento local protegido
              </span>
              <p className="text-xs text-amber-800">
                Active el almacenamiento persistente para evitar la pérdida de
                datos del navegador.
              </p>
              {persistenceMessage && (
                <p className="text-xs mt-1 text-amber-900 font-semibold">
                  {persistenceMessage.text}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onRequestPersistence}
              disabled={isRequestingPersistence}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-xl text-xs min-h-[38px] whitespace-nowrap shadow"
            >
              {isRequestingPersistence ? 'Activando...' : 'Activar'}
            </button>
            <button
              onClick={onDismiss}
              className="text-amber-700 hover:text-amber-900 p-2 rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Cerrar aviso"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {isPersistent === true && persistenceMessage && (
        <div
          className="bg-emerald-100 text-emerald-900 p-4 rounded-xl shadow"
          role="status"
        >
          <p className="font-bold">{persistenceMessage.text}</p>
        </div>
      )}
      {persistenceMessage &&
        isPersistent !== false &&
        isPersistent !== true && (
          <div
            className="bg-slate-100 text-slate-900 p-4 rounded-xl shadow"
            role="status"
          >
            <p className="font-bold">{persistenceMessage.text}</p>
          </div>
        )}
    </>
  );
};

export default StorageBanner;

