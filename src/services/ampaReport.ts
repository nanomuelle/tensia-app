import type { BloodPressureRecord } from './db';

export type AmpaPeriods = 'all' | 'morning-night';

export const SESSION_GAP_MINUTES = 15;
export const isHigh = (systolic: number, diastolic: number) =>
  systolic >= 135 || diastolic >= 85;
export const rounded = (value: number) => Math.round(value);

export function localClock(instant: Date | number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('es-ES', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)!.value;
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
    dayFraction: (+part('hour') * 3600 + +part('minute') * 60 + +part('second')) / 86400,
  };
}

export function addDays(date: string, days: number) {
  const civil = new Date(date + 'T00:00:00Z');
  civil.setUTCDate(civil.getUTCDate() + days);
  return civil.toISOString().slice(0, 10);
}

export function mondayOf(date: string) {
  const day = new Date(date + 'T00:00:00Z').getUTCDay();
  return addDays(date, -((day + 6) % 7));
}

export const displayDate = (date: string) => date.split('-').reverse().join('/');

type Vitals = Pick<BloodPressureRecord, 'systolic' | 'diastolic' | 'pulse'>;
function mean(values: readonly Vitals[]): Vitals {
  const totals = values.reduce((sum, value) => ({
    systolic: sum.systolic + value.systolic,
    diastolic: sum.diastolic + value.diastolic,
    pulse: sum.pulse + value.pulse,
  }), { systolic: 0, diastolic: 0, pulse: 0 });
  return {
    systolic: totals.systolic / values.length,
    diastolic: totals.diastolic / values.length,
    pulse: totals.pulse / values.length,
  };
}

function groupSessions(readings: readonly BloodPressureRecord[], timeZone: string, gapMinutes: number) {
  const ordered = readings.map(reading => ({ reading, instant: Date.parse(reading.timestamp) }))
    .sort((a, b) => a.instant - b.instant || (a.reading.id ?? 0) - (b.reading.id ?? 0));
  const groups: typeof ordered[] = [];
  for (const entry of ordered) {
    const group = groups[groups.length - 1];
    const previous = group?.[group.length - 1];
    if (group && previous && previous.reading.period === entry.reading.period &&
        entry.instant - previous.instant <= gapMinutes * 60_000) {
      group.push(entry);
    } else {
      groups.push([entry]);
    }
  }

  return groups.map(group => {
    const first = group[0];
    const clock = localClock(first.instant, timeZone);
    const items = group.map(entry => entry.reading);
    const omitFirst = items.length >= 3;
    const used = omitFirst ? items.slice(1) : items;
    return { ...clock, instant: first.instant, period: first.reading.period,
      items, omitFirst, usedCount: used.length, average: mean(used) };
  });
}

export function availableAmpaWeeks(
  readings: readonly BloodPressureRecord[], timeZone: string, periods: AmpaPeriods,
) {
  return [...new Set(groupSessions(readings, timeZone, SESSION_GAP_MINUTES)
    .filter(session => periods === 'all' || session.period !== 'Tarde')
    .map(session => mondayOf(session.date)))].sort().reverse();
}

export function closestAmpaWeek(weeks: readonly string[], today: string) {
  const distance = (monday: string) => {
    const sunday = addDays(monday, 6);
    if (today < monday) return Date.parse(monday) - Date.parse(today);
    if (today > sunday) return Date.parse(today) - Date.parse(sunday);
    return 0;
  };
  return [...weeks].sort((a, b) => distance(a) - distance(b) || a.localeCompare(b))[0] ?? '';
}

export function buildAmpaReport(
  readings: readonly BloodPressureRecord[], monday: string, timeZone: string,
  gapMinutes = SESSION_GAP_MINUTES, periods: AmpaPeriods = 'all',
) {
  const sunday = addDays(monday, 6);
  const sessions = groupSessions(readings, timeZone, gapMinutes)
    .filter(session => session.date >= monday && session.date <= sunday &&
      (periods === 'all' || session.period !== 'Tarde'))
    .sort((a, b) => a.date.localeCompare(b.date) || a.dayFraction - b.dayFraction ||
      a.instant - b.instant || (a.items[0].id ?? 0) - (b.items[0].id ?? 0));

  const summary = (label: string, selected: typeof sessions) => ({
    label, count: selected.length,
    average: selected.length ? mean(selected.map(session => session.average)) : null,
  });
  const morningNight = summary('Media semanal (mañana y noche)', sessions.filter(s => s.period !== 'Tarde'));
  const summaries = [
    summary('Media de mañana', sessions.filter(s => s.period === 'Mañana')),
    ...(periods === 'all' ? [summary('Media de tarde', sessions.filter(s => s.period === 'Tarde'))] : []),
    summary('Media de noche', sessions.filter(s => s.period === 'Noche')),
    morningNight,
    ...(periods === 'all' ? [summary('Media semanal (todas las franjas)', sessions)] : []),
  ];
  const included = sessions.flatMap(session => session.items);
  const highCount = included.filter(r => isHigh(r.systolic, r.diastolic)).length;
  return {
    monday, sunday, timeZone, periods, sessions, summaries, morningNight, highCount, readingCount: included.length,
    highPercent: included.length ? rounded(100 * highCount / included.length) : 0,
  };
}

export type AmpaReport = ReturnType<typeof buildAmpaReport>;
