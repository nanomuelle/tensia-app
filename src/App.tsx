import React, { useState, useEffect } from 'react';
import { Plus, Heart, Calendar, FileText, Download, Upload, Share2, Trash2, Edit2, CheckCircle2, X, Activity } from 'lucide-react';
import { BloodPressureRecord, getAllReadings, addReading, updateReading, deleteReading, exportDatabaseToJson, importDatabaseFromJson } from './db';
import { jsPDF } from 'jspdf';

export default function App() {
  const [readings, setReadings] = useState<BloodPressureRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('70');
  const [timestamp, setTimestamp] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPersistent, setIsPersistent] = useState<boolean | null>(null);
  const [isRequestingPersistence, setIsRequestingPersistence] = useState(false);
  const [persistenceMessage, setPersistenceMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
    if (navigator.storage?.persisted) {
      navigator.storage.persisted().then(setIsPersistent).catch(() => {});
    }
  }, []);

  async function handleRequestPersistence() {
    setIsRequestingPersistence(true);
    setPersistenceMessage(null);
    try {
      if (!navigator.storage?.persist) {
        setPersistenceMessage({
          text: 'La función de almacenamiento persistente no es compatible con este navegador.',
          type: 'info'
        });
        setIsRequestingPersistence(false);
        return;
      }
      const granted = await navigator.storage.persist();
      setIsPersistent(granted);
      if (granted) {
        setPersistenceMessage({
          text: 'El almacenamiento persistente está activado correctamente.',
          type: 'success'
        });
      } else {
        setPersistenceMessage({
          text: 'El navegador rechazó la solicitud de almacenamiento persistente. Sus lecturas siguen guardándose localmente, pero podrían eliminarse si el navegador necesita liberar espacio.',
          type: 'warning'
        });
      }
    } catch (err) {
      setPersistenceMessage({
        text: 'No se pudo completar la solicitud de almacenamiento persistente.',
        type: 'error'
      });
    } finally {
      setIsRequestingPersistence(false);
    }
  }

  async function loadData() {
    setReadings(await getAllReadings());
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

    if (isNaN(sys) || sys < 40 || sys > 250) { setErrorMsg('Sistólica entre 40 y 250.'); return; }
    if (isNaN(dia) || dia < 20 || dia > 160) { setErrorMsg('Diastólica entre 20 y 160.'); return; }
    if (isNaN(pul) || pul < 10 || pul > 250) { setErrorMsg('Pulso entre 10 y 250.'); return; }

    const isoDate = new Date(timestamp).toISOString();
    if (editingId) {
      await updateReading(editingId, { systolic: sys, diastolic: dia, pulse: pul, timestamp: isoDate, notes: notes.trim() || undefined });
      setSuccessMsg('¡Medición actualizada!');
    } else {
      await addReading({ systolic: sys, diastolic: dia, pulse: pul, timestamp: isoDate, notes: notes.trim() || undefined });
      setSuccessMsg('¡Medición guardada!');
    }
    setIsModalOpen(false);
    loadData();
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleDelete(id: number) {
    if (window.confirm('¿Eliminar esta medición?')) {
      await deleteReading(id);
      setSuccessMsg('Medición eliminada.');
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  }

  function getCategory(sys: number, dia: number) {
    if (sys < 120 && dia < 80) return { label: 'Óptima', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (sys <= 129 && dia <= 84) return { label: 'Normal', color: 'bg-green-100 text-green-800 border-green-300' };
    if (sys <= 139 || dia <= 89) return { label: 'Normal-Alta', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    if (sys <= 159 || dia <= 99) return { label: 'Grado 1', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    if (sys <= 179 || dia <= 109) return { label: 'Grado 2', color: 'bg-red-100 text-red-800 border-red-300' };
    return { label: 'Grado 3', color: 'bg-rose-200 text-rose-900 border-rose-400 font-bold' };
  }

  function generatePDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Tensia - Informe de Tensión", 14, 20);
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()} | Total: ${readings.length}`, 14, 28);
    let y = 38;
    readings.forEach(r => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${new Date(r.timestamp).toLocaleString()} - ${r.period}: ${r.systolic}/${r.diastolic} mmHg (Pulso: ${r.pulse})`, 14, y);
      y += 8;
    });
    doc.save(`Tensia-Informe.pdf`);
  }

  async function handleExportJson() {
    const jsonStr = await exportDatabaseToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tensia-Backup.json`;
    a.click();
  }

  async function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await importDatabaseFromJson(ev.target?.result as string);
        setSuccessMsg('¡Copia restaurada con éxito!');
        loadData();
      } catch (err) { alert('Error al importar'); }
    };
    reader.readAsText(file);
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

  const grouped: { [key: string]: BloodPressureRecord[] } = {};
  readings.forEach(r => {
    const key = new Date(r.timestamp).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  return (
    <div className="min-h-screen bg-sky-50 pb-16">
      <header className="bg-sky-700 text-white shadow-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8" />
            <h1 className="text-2xl font-black">Tensia</h1>
          </div>
          <button onClick={handleOpenNewModal} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-3 rounded-2xl flex items-center space-x-2 text-lg min-h-[48px]">
            <Plus className="w-6 h-6" /> <span>Nueva Toma</span>
          </button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {successMsg && <div className="bg-emerald-100 text-emerald-900 p-3 rounded-xl font-bold flex items-center space-x-2"><CheckCircle2 className="w-6 h-6"/><span>{successMsg}</span></div>}
        {isPersistent === false && (
          <div className="bg-amber-100 text-amber-900 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow" role="status">
            <div>
              <span className="font-bold block">Active el almacenamiento persistente.</span>
              {persistenceMessage && (
                <p className="text-sm mt-1 text-amber-800">{persistenceMessage.text}</p>
              )}
            </div>
            <button 
              onClick={handleRequestPersistence} 
              disabled={isRequestingPersistence}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg min-h-[44px] whitespace-nowrap"
            >
              {isRequestingPersistence ? 'Activando...' : 'Activar'}
            </button>
          </div>
        )}
        {isPersistent === true && persistenceMessage && (
          <div className="bg-emerald-100 text-emerald-900 p-4 rounded-xl shadow" role="status">
            <p className="font-bold">{persistenceMessage.text}</p>
          </div>
        )}
        {persistenceMessage && isPersistent !== false && isPersistent !== true && (
          <div className="bg-slate-100 text-slate-900 p-4 rounded-xl shadow" role="status">
            <p className="font-bold">{persistenceMessage.text}</p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={generatePDF} disabled={!readings.length} className="bg-white p-3 rounded-2xl border-2 border-sky-200 font-bold text-sky-900 flex flex-col items-center disabled:opacity-50 min-h-[56px]"><FileText className="w-6 h-6 text-sky-700 mb-1"/>PDF</button>
          <button onClick={handleShare} disabled={!readings.length} className="bg-white p-3 rounded-2xl border-2 border-sky-200 font-bold text-sky-900 flex flex-col items-center disabled:opacity-50 min-h-[56px]"><Share2 className="w-6 h-6 text-sky-700 mb-1"/>Compartir</button>
          <button onClick={handleExportJson} disabled={!readings.length} className="bg-white p-3 rounded-2xl border-2 border-sky-200 font-bold text-sky-900 flex flex-col items-center disabled:opacity-50 min-h-[56px]"><Download className="w-6 h-6 text-sky-700 mb-1"/>Backup</button>
          <div className="relative flex flex-col items-center">
            <button disabled className="w-full h-full bg-slate-100 p-3 rounded-2xl border-2 border-slate-200 font-bold text-slate-400 flex flex-col items-center justify-center opacity-70 cursor-not-allowed min-h-[56px]">
              <Upload className="w-6 h-6 text-slate-400 mb-1"/>Restaurar
            </button>
            <span className="absolute -bottom-5 text-[10px] text-slate-500 font-bold whitespace-nowrap">Disponible próximamente</span>
          </div>
        </div>
        <div className="pt-3"></div>
        <section className="space-y-4 pt-2">
          <h2 className="text-2xl font-extrabold text-slate-800">Historial</h2>
          {!readings.length ? (
            <div className="bg-white border-2 border-dashed border-sky-200 rounded-3xl p-10 text-center space-y-3">
              <Heart className="w-12 h-12 text-sky-700 mx-auto"/>
              <p className="text-slate-600 text-lg">No hay tomas registradas.</p>
              <button onClick={handleOpenNewModal} className="bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl min-h-[48px]">Registrar Toma</button>
            </div>
          ) : (
            Object.entries(grouped).map(([date, list]) => (
              <div key={date} className="space-y-3">
                <h3 className="text-lg font-bold text-sky-900 bg-sky-200 px-4 py-2 rounded-xl">{date}</h3>
                {list.map(r => {
                  const cat = getCategory(r.systolic, r.diastolic);
                  return (
                    <div key={r.id} className="bg-white border-2 border-sky-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-baseline space-x-3">
                          <span className="text-3xl font-black">{r.systolic}/{r.diastolic}</span>
                          <span className="text-sm font-semibold text-slate-500">mmHg</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${cat.color}`}>{cat.label}</span>
                        </div>
                        <p className="text-sm text-slate-600">🕒 {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {r.period} • Pulso: {r.pulse} lpm</p>
                        {r.notes && <p className="text-sm bg-slate-50 p-2 rounded-xl text-slate-700 italic">💬 {r.notes}</p>}
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleOpenEditModal(r)} className="p-3 bg-sky-50 text-sky-700 rounded-xl min-h-[48px] min-w-[48px] flex items-center justify-center"><Edit2 className="w-5 h-5"/></button>
                        <button onClick={() => r.id && handleDelete(r.id)} className="p-3 bg-rose-50 text-rose-700 rounded-xl min-h-[48px] min-w-[48px] flex items-center justify-center"><Trash2 className="w-5 h-5"/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </section>
      </main>
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-2xl font-black">{editingId ? 'Editar' : 'Nueva Toma'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center"><X className="w-6 h-6"/></button>
            </div>
            {errorMsg && <div className="bg-rose-100 text-rose-900 p-3 rounded-xl font-bold">{errorMsg}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold block mb-1">Sistólica</label>
                  <input type="number" min="40" max="250" value={systolic} onChange={e => setSystolic(e.target.value)} className="w-full text-3xl font-black p-3 bg-sky-50 border-2 rounded-2xl text-center min-h-[56px]" required />
                </div>
                <div>
                  <label className="font-bold block mb-1">Diastólica</label>
                  <input type="number" min="20" max="160" value={diastolic} onChange={e => setDiastolic(e.target.value)} className="w-full text-3xl font-black p-3 bg-sky-50 border-2 rounded-2xl text-center min-h-[56px]" required />
                </div>
              </div>
              <div>
                <label className="font-bold block nis-1">Pulso</label>
                <input type="number" min="10" max="250" value={pulse} onChange={e => setPulse(e.target.value)} className="w-full text-2xl font-bold p-3 bg-sky-50 border-2 rounded-2xl text-center min-h-[52px]" required />
              </div>
              <div>
                <label className="font-bold block mb-1">Fecha y Hora</label>
                <input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} className="w-full text-lg font-bold p-3 bg-sky-50 border-2 rounded-2xl min-h-[52px]" required />
              </div>
              <div>
                <label className="font-bold block mb-1">Notas</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 bg-sky-50 border-2 rounded-2xl" />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-slate-200 font-bold rounded-2xl min-h-[48px]">Cancelar</button>
                <button type="submit" className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow min-h-[48px]">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
