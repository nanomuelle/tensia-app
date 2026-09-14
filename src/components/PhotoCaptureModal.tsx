import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (file: File | Blob) => void;
}

export function PhotoCaptureModal({ isOpen, onClose, onImageSelected }: PhotoCaptureModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-sky-100">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">Foto del Tensiómetro</h3>
              <p className="text-sm font-medium text-slate-600">Captura o selecciona una imagen</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl min-h-[48px] min-w-[48px] flex items-center justify-center font-bold"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 pt-2">
          {/* Hidden inputs */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={cameraInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="w-full py-5 px-6 bg-sky-600 hover:bg-sky-700 text-white font-black text-xl rounded-2xl shadow-lg min-h-[64px] flex items-center justify-center space-x-3 transition"
          >
            <Camera className="w-8 h-8" />
            <span>Hacer Foto con Cámara</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-5 px-6 bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold text-lg rounded-2xl min-h-[60px] flex items-center justify-center space-x-3 transition"
          >
            <Upload className="w-7 h-7 text-sky-700" />
            <span>Seleccionar de la Galería</span>
          </button>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-2xl min-h-[52px]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
