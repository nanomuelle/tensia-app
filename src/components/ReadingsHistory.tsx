import React, { useMemo } from 'react';
import { Heart, Edit2, Trash2 } from 'lucide-react';
import { ReadingCategoryBadge } from './ReadingCategoryBadge';
import type { BloodPressureRecord } from '../services/db';

export interface ReadingsHistoryProps {
  readings: BloodPressureRecord[];
  onEdit: (reading: BloodPressureRecord) => void;
  onDelete: (id: number) => void;
  onAddNew?: () => void;
}

export const ReadingsHistory: React.FC<ReadingsHistoryProps> = ({
  readings,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const grouped = useMemo(() => {
    const map: { [key: string]: BloodPressureRecord[] } = {};
    readings.forEach((r) => {
      const key = new Date(r.timestamp).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [readings]);

  return (
    <section className="space-y-4 pt-2">
      <h2 className="text-2xl font-extrabold text-slate-800">Historial</h2>
      {!readings.length ? (
        <div className="bg-white border-2 border-dashed border-sky-200 rounded-3xl p-10 text-center space-y-3">
          <Heart className="w-12 h-12 text-sky-700 mx-auto" />
          <p className="text-slate-600 text-lg">No hay tomas registradas.</p>
          {onAddNew && (
            <button
              onClick={onAddNew}
              className="bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl min-h-[48px]"
            >
              Registrar Toma
            </button>
          )}
        </div>
      ) : (
        Object.entries(grouped).map(([date, list]) => {
          const morning = list.filter((r) => r.period === 'Mañana');
          const afternoonNight = list.filter(
            (r) => r.period === 'Tarde' || r.period === 'Noche'
          );
          const sortedRev = [...list].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          return (
            <div
              key={date}
              className="bg-white border-2 border-sky-100 rounded-3xl p-5 shadow-sm space-y-4"
            >
              <h3 className="text-lg font-bold text-sky-900 bg-sky-100 px-4 py-2 rounded-xl">
                {date}
              </h3>
              <div className="hidden md:grid md:grid-cols-2 gap-4">
                <div className="space-y-3 bg-sky-50/50 p-4 rounded-2xl border border-sky-100">
                  <div className="font-bold text-sky-900 text-sm border-b border-sky-200 pb-2">
                    🌅 Mañana (06:00–11:59)
                  </div>
                  {!morning.length ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      Sin lecturas en la mañana
                    </p>
                  ) : (
                    morning.map((r) => (
                      <div
                        key={r.id}
                        className="bg-white border border-sky-200 rounded-2xl p-4 shadow-sm flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-baseline space-x-2">
                            <span className="text-xl font-black">
                              {r.systolic}/{r.diastolic}
                            </span>
                            <ReadingCategoryBadge
                              systolic={r.systolic}
                              diastolic={r.diastolic}
                            />
                          </div>
                          <p className="text-xs text-slate-600">
                            🕒{' '}
                            {new Date(r.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            • Pulso: {r.pulse} lpm
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => onEdit(r)}
                            className="p-2 bg-sky-50 text-sky-700 rounded-xl"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => r.id && onDelete(r.id)}
                            className="p-2 bg-rose-50 text-rose-700 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-100">
                  <div className="font-bold text-amber-900 text-sm border-b border-amber-200 pb-2">
                    🌇 Tarde & Noche (12:00–05:59)
                  </div>
                  {!afternoonNight.length ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      Sin lecturas en tarde/noche
                    </p>
                  ) : (
                    afternoonNight.map((r) => (
                      <div
                        key={r.id}
                        className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-baseline space-x-2">
                            <span className="text-xl font-black">
                              {r.systolic}/{r.diastolic}
                            </span>
                            <ReadingCategoryBadge
                              systolic={r.systolic}
                              diastolic={r.diastolic}
                            />
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                              {r.period}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            🕒{' '}
                            {new Date(r.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            • Pulso: {r.pulse} lpm
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => onEdit(r)}
                            className="p-2 bg-sky-50 text-sky-700 rounded-xl"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => r.id && onDelete(r.id)}
                            className="p-2 bg-rose-50 text-rose-700 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="md:hidden space-y-3">
                {sortedRev.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white border border-sky-200 rounded-2xl p-4 shadow-sm flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black">
                          {r.systolic}/{r.diastolic}
                        </span>
                        <ReadingCategoryBadge
                          systolic={r.systolic}
                          diastolic={r.diastolic}
                        />
                        <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded">
                          {r.period}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        🕒{' '}
                        {new Date(r.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • Pulso: {r.pulse} lpm
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => onEdit(r)}
                        className="p-2 bg-sky-50 text-sky-700 rounded-xl"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => r.id && onDelete(r.id)}
                        className="p-2 bg-rose-50 text-rose-700 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
};

export default ReadingsHistory;
