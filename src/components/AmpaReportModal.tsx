import { localReadings, readingsInRange, renderReadingsPdf } from '../services/pdfService';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { APP_NAME } from '../appConfig';
import { addDays, availableAmpaWeeks, buildAmpaReport, closestAmpaWeek, displayDate, localClock } from '../services/ampaReport';
import type { BloodPressureRecord } from '../services/db';
import type { AmpaPeriods } from '../services/ampaReport';
import { renderAmpaPdf } from '../services/ampaPdfService';
import { getAllReadings } from '../services/readingsService';
import { getAmpaProfile, saveAmpaProfile } from '../services/settingsService';
import type { AmpaProfile } from '../services/settingsService';

const blankProfile: AmpaProfile = { name: '', birthDate: '', medication: '', monitor: '', arm: '' };
const fields = [
  ['name', 'Nombre', 'text'],
  ['birthDate', 'Fecha de nacimiento', 'date'],
  ['medication', 'Medicación', 'text'],
  ['monitor', 'Tensiómetro', 'text'],
] as const;
const inputClass = 'block w-full rounded-lg border border-slate-300 bg-white p-2 mt-1';
const buttonClass = 'rounded-lg bg-sky-700 px-4 py-2 text-white disabled:opacity-50';

export function AmpaReportModal({ onClose, mode = 'ampa' }: { onClose: () => void; mode?: 'ampa' | 'history' }) {
  const isAmpa = mode === 'ampa';
  const dialog = useRef<HTMLDialogElement>(null);
  const [timeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [today] = useState(() => localClock(new Date(), timeZone).date);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [readings, setReadings] = useState<BloodPressureRecord[]>([]);
  const dates = useMemo(() => isAmpa ? [] : localReadings(readings, timeZone), [isAmpa, readings, timeZone]);
  const [from, setFrom] = useState<string>();
  const [to, setTo] = useState<string>();
  const start = from ?? dates[0]?.date ?? '';
  const end = to ?? dates[dates.length - 1]?.date ?? '';
  const [profile, setProfile] = useState(blankProfile);
  const periods = profile.periods ?? 'all';
  const weeks = useMemo(() => isAmpa ? availableAmpaWeeks(readings, timeZone, periods) : [], [isAmpa, readings, timeZone, periods]);
  const monday = weeks.includes(selectedWeek) ? selectedWeek : closestAmpaWeek(weeks, today);
  const [saveError, setSaveError] = useState(false);
  const [readError, setReadError] = useState(false);
  const latestSave = useRef(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    dialog.current?.showModal();
    let active = true;
    Promise.allSettled([getAmpaProfile(), getAllReadings()]).then(([saved, history]) => {
      if (!active) return;
      if (saved.status === 'fulfilled' && saved.value) setProfile({ ...blankProfile, ...saved.value });
      if (saved.status === 'rejected') setMessage('No se pudieron cargar los datos guardados.');
      if (history.status === 'fulfilled') setReadings(history.value);
      else setReadError(true);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  function updateProfile(changes: Partial<AmpaProfile>) {
    setProfile(current => ({ ...current, ...changes }));
    setMessage('');
    const revision = ++latestSave.current;
    void saveAmpaProfile(changes).then(() => {
      if (revision === latestSave.current) setSaveError(false);
    }, () => {
      if (revision === latestSave.current) setSaveError(true);
    });
  }

  function generate(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (!isAmpa && (!start || !end || start > end)) {
      setMessage('Indica un intervalo válido. Desde debe ser anterior o igual a Hasta.');
      return;
    }
    try {
      const clean = { ...profile, name: profile.name.trim(), medication: profile.medication.trim(), monitor: profile.monitor.trim() };
      if (!clean.name || !clean.medication || !clean.monitor || !clean.birthDate || !clean.arm) {
        setMessage('Completa los datos de cabecera. Si no tomas medicación, indica «Sin medicación».');
        return;
      }
      const now = new Date();
      let pdf;
      if (isAmpa) {
        const report = buildAmpaReport(readings, monday, timeZone, undefined, periods);
        if (!report.sessions.length) {
          setMessage('No hay lecturas para la semana y las franjas seleccionadas.');
          return;
        }
        pdf = renderAmpaPdf(report, clean, APP_NAME, now);
      } else {
        const selected = readingsInRange(dates, start, end);
        if (!selected.length) {
          setMessage('No hay lecturas en el intervalo seleccionado.');
          return;
        }
        pdf = renderReadingsPdf(selected, clean, start, end, APP_NAME, localClock(now, timeZone).date);
      }
      const { bytes, filename } = pdf;
      const generated = new File([bytes], filename, { type: 'application/pdf' });
      download(generated);
    } catch {
      setMessage('No se pudo preparar el informe. Inténtalo de nuevo.');
      return;
    }
    onClose();
  }

  function download(file: File) {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="ampa-title"
      className="w-[calc(100%-2rem)] max-w-lg rounded-2xl p-5 text-slate-900 backdrop:bg-slate-900/60">
      <div className="flex items-center justify-between gap-3">
        <h2 id="ampa-title" className="text-xl font-bold">{isAmpa ? 'Informe semanal AMPA' : 'Informe de lecturas de presión arterial'}</h2>
        <button type="button" className="p-2" onClick={onClose}>Cerrar</button>
      </div>
      <form onSubmit={generate} noValidate>
        <fieldset disabled={loading} className="space-y-3">
          {isAmpa ? <>
          <label className="block">
            Semana del informe
            <select value={monday} className={inputClass}
              onChange={event => { setSelectedWeek(event.target.value); setMessage(''); }}>
              {!weeks.length && <option value="">{loading ? 'Cargando…' : 'Sin semanas disponibles'}</option>}
              {weeks.map(week => <option key={week} value={week}>
                {displayDate(week)} – {displayDate(addDays(week, 6))}
              </option>)}
            </select>
          </label>
          <label className="block">
            Franjas incluidas
            <select value={periods} className={inputClass}
              onChange={event => { setSelectedWeek(monday); updateProfile({ periods: event.target.value as AmpaPeriods }); }}>
              <option value="all">Mañana, tarde y noche</option>
              <option value="morning-night">Solo mañana y noche</option>
            </select>
          </label>
          </> : <>
            <label className="block">
              Desde
              <input type="date" value={start} className={inputClass}
                onChange={event => { setFrom(event.target.value); setMessage(''); }} />
            </label>
            <label className="block">
              Hasta
              <input type="date" value={end} className={inputClass}
                onChange={event => { setTo(event.target.value); setMessage(''); }} />
            </label>
          </>}
          <p>{timeZone}</p>
          {fields.map(([key, label, type]) => (
            <label key={key} className="block">
              {label}
              <input type={type} value={profile[key]} required maxLength={160} className={inputClass}
                onChange={event => { updateProfile({ [key]: event.target.value }); }} />
            </label>
          ))}
          <label className="block">
            Brazo usado
            <select required value={profile.arm} className={inputClass}
              onChange={event => { updateProfile({ arm: event.target.value as AmpaProfile['arm'] }); }}>
              <option value="">Selecciona un brazo</option>
              <option>Izquierdo</option>
              <option>Derecho</option>
            </select>
          </label>
          <button disabled={isAmpa ? !monday : !dates.length} className={buttonClass} type="submit">Generar y descargar PDF</button>
        </fieldset>
      </form>
      <p role="status" className="mt-3">{message}</p>
      {saveError && <p role="alert">No se pudieron guardar las preferencias del informe.</p>}
      {readError && <p role="alert">No se pudieron cargar las lecturas.</p>}
      {!loading && !readError && isAmpa && !weeks.length && <p role="status">No hay lecturas para las franjas seleccionadas.</p>}
      {!loading && !readError && !isAmpa && !dates.length && <p role="status">No hay lecturas disponibles.</p>}
    </dialog>
  );
}
