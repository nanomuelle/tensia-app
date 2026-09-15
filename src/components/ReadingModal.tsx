import React from 'react';
import { X } from 'lucide-react';

export interface ReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: number | null;
  systolic: string;
  diastolic: string;
  pulse: string;
  timestamp: string;
  notes: string;
  errorMsg: string | null;
  setSystolic: (value: string) => void;
  setDiastolic: (value: string) => void;
  setPulse: (value: string) => void;
  setTimestamp: (value: string) => void;
  setNotes: (value: string) => void;
  onSave: (e: React.FormEvent) => void;
}

export const ReadingModal: React.FC<ReadingModalProps> = ({
  isOpen,
  onClose,
  editingId,
  systolic,
  diastolic,
  pulse,
  timestamp,
  notes,
  errorMsg,
  setSystolic,
  setDiastolic,
  setPulse,
  setTimestamp,
  setNotes,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-2xl font-black">
            {editingId ? 'Editar' : 'Nueva Toma'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {errorMsg && (
          <div className="bg-rose-100 text-rose-900 p-3 rounded-xl font-bold">
            {errorMsg}
          </div>
        )}
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold block mb-1">Sistólica</label>
              <input
                type="number"
                min="40"
                max="250"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                className="w-full text-3xl font-black p-3 bg-sky-50 border-2 rounded-2xl text-center min-h-[56px]"
                required
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Diastólica</label>
              <input
                type="number"
                min="20"
                max="160"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                className="w-full text-3xl font-black p-3 bg-sky-50 border-2 rounded-2xl text-center min-h-[56px]"
                required
              />
            </div>
          </div>
          <div>
            <label className="font-bold block mb-1">Pulso</label>
            <input
              type="number"
              min="10"
              max="250"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              className="w-full text-2xl font-bold p-3 bg-sky-50 border-2 rounded-2xl text-center min-h-[52px]"
              required
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Fecha y Hora</label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full text-lg font-bold p-3 bg-sky-50 border-2 rounded-2xl min-h-[52px]"
              required
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Notas</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-sky-50 border-2 rounded-2xl"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-200 font-bold rounded-2xl min-h-[48px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow min-h-[48px]"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReadingModal;

