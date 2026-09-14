import React, { useState } from 'react';
import { Shield, Check, X, AlertTriangle } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export function PrivacyModal({ isOpen, onAccept, onCancel }: PrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-amber-200">
        <div className="flex items-center space-x-3 border-b pb-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">Aviso de Privacidad (IA)</h3>
            <p className="text-sm font-medium text-slate-600">Reconocimiento fotográfico con Gemini</p>
          </div>
        </div>

        <div className="space-y-4 text-slate-700 font-medium text-base">
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <p>
              Al utilizar la función de foto, la imagen de tu tensiómetro se procesa temporalmente para extraer los números.
            </p>
          </div>

          <ul className="space-y-2 pl-2">
            <li className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Las fotos <strong>nunca se almacenan</strong> en bases de datos ni servidores.</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Tu clave de API y tus datos de tensión se quedan 100% en tu dispositivo.</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Podrás revisar y corregir los valores antes de guardarlos.</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-2xl min-h-[52px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg min-h-[52px] transition flex items-center justify-center space-x-2"
          >
            <span>Aceptar y Continuar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
