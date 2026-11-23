import assert from 'node:assert/strict';
import test from 'node:test';
import { availableAmpaWeeks, closestAmpaWeek, buildAmpaReport, localClock, mondayOf, addDays, isHigh, rounded } from '../src/services/ampaReport.ts';
import { renderAmpaPdf } from '../src/services/ampaPdfService.ts';
import type { BloodPressureRecord } from '../src/services/db.ts';

const zone = 'Europe/Madrid';
const monday = '2026-11-16';
const fixture = `
15 23:08 138 80 61 N
15 23:09 141 81 57 N
15 23:10 127 81 58 N
16 08:01 163 93 61 M
16 08:02 155 91 57 M
16 08:03 151 95 56 M
16 12:06 122 73 64 T
16 12:07 121 73 60 T
16 12:08 124 76 60 T
17 07:30 159 94 63 M
17 07:31 136 85 58 M
17 07:32 143 90 62 M
17 22:06 142 83 73 N
17 22:08 137 83 67 N
17 22:09 125 75 65 N
17 22:10 142 79 67 N
17 22:11 132 81 69 N
18 07:08 165 89 68 M
18 07:09 148 83 60 M
18 07:10 139 82 57 M
18 23:25 149 91 58 N
18 23:26 129 80 54 N
18 23:27 149 90 54 N
19 07:54 152 94 65 M
19 07:55 149 93 62 M
19 07:56 137 89 62 M
20 07:42 162 85 69 M
20 07:43 138 66 66 M
20 07:44 140 74 57 M
20 07:45 135 68 56 M
21 19:33 138 89 62 N
21 19:35 136 88 59 N
21 19:36 134 83 61 N
22 10:55 144 93 66 M
22 10:56 135 90 61 M
22 10:57 134 91 62 M
22 21:32 126 84 68 N
22 21:33 128 83 61 N
22 21:34 132 80 62 N
`.trim().split('\n').map((line, i): BloodPressureRecord => {
  const [day, time, systolic, diastolic, pulse, period] = line.split(' ');
  const periods = { M: 'Mañana', T: 'Tarde', N: 'Noche' } as const;
  return { id: 230 + i, timestamp: `2026-11-${day}T${time}Z`,
    systolic: +systolic, diastolic: +diastolic, pulse: +pulse, period: periods[period as keyof typeof periods] };
});

const report = buildAmpaReport(fixture, monday, zone);
const show = (a: BloodPressureRecord | { systolic: number; diastolic: number }) =>
  `${rounded(a.systolic)}/${rounded(a.diastolic)}`;

test('fixture AMPA: sesiones, medias y recuentos', () => {
  assert.deepEqual(report.sessions.map(s => [
    s.date.slice(-2), s.period, s.time, s.items.slice(0, 3).map(show).join(' '),
    show(s.average), s.items.length, s.items.slice(0, 3).map(r => r.pulse).join('/'),
  ].join(' ')), [
    '16 Noche 00:08 138/80 141/81 127/81 134/81 3 61/57/58',
    '16 Mañana 09:01 163/93 155/91 151/95 153/93 3 61/57/56',
    '16 Tarde 13:06 122/73 121/73 124/76 123/75 3 64/60/60',
    '17 Mañana 08:30 159/94 136/85 143/90 140/88 3 63/58/62',
    '17 Noche 23:06 142/83 137/83 125/75 134/80 5 73/67/65',
    '18 Mañana 08:08 165/89 148/83 139/82 144/83 3 68/60/57',
    '19 Noche 00:25 149/91 129/80 149/90 139/85 3 58/54/54',
    '19 Mañana 08:54 152/94 149/93 137/89 143/91 3 65/62/62',
    '20 Mañana 08:42 162/85 138/66 140/74 138/69 4 69/66/57',
    '21 Noche 20:33 138/89 136/88 134/83 135/86 3 62/59/61',
    '22 Mañana 11:55 144/93 135/90 134/91 135/91 3 66/61/62',
    '22 Noche 22:32 126/84 128/83 132/80 130/82 3 68/61/62',
  ]);
  assert.deepEqual(report.summaries.map(s => [show(s.average!), rounded(s.average!.pulse), s.count]),
    [['142/86', 60, 6], ['123/75', 60, 1], ['134/83', 60, 5], ['138/84', 60, 11], ['137/83', 60, 12]]);
  assert.deepEqual([report.readingCount, report.sessions.length, report.highCount, report.highPercent], [39, 12, 28, 72]);
});

const reading = (id: number, timestamp: string, period: BloodPressureRecord['period'] = 'Noche') =>
  ({ ...fixture[0], id, timestamp, period });

test('los límites usan el inicio de sesión y el intervalo real entre lecturas', () => {
  const result = buildAmpaReport([
    reading(2, '2026-11-15T23:05Z'), reading(1, '2026-11-15T22:56Z'),
    reading(4, '2026-11-22T22:55Z'), reading(3, '2026-11-22T22:55Z'),
    reading(5, '2026-11-22T23:10Z'), reading(6, '2026-11-22T23:25:01Z'),
  ], monday, zone);
  assert.deepEqual(result.sessions.map(s => s.items.map(r => r.id)), [[3, 4, 5]]);
  assert.equal(result.summaries[0].average, null);
});

test('sesiones cortas, cambio de franja, umbrales y semana vacía', () => {
  const readings = [
    reading(1, '2026-11-16T10:00Z'), reading(2, '2026-11-16T10:00:30Z'),
    reading(3, '2026-11-16T10:01Z', 'Mañana'),
  ];
  assert.deepEqual(buildAmpaReport(readings, monday, zone).sessions.map(s => s.items.length), [2, 1]);
  assert.equal(buildAmpaReport(readings, '2026-11-23', zone).readingCount, 0);
  assert.equal(isHigh(135, 84), true);
  assert.equal(isHigh(134, 85), true);
  assert.equal(isHigh(134, 84), false);
  assert.equal(rounded(134.5), 135);
  assert.equal(addDays(mondayOf('2026-11-23'), -7), monday);
});

test('horario de verano: salto y repetición de la hora civil', () => {
  const spring = buildAmpaReport([
    reading(1, '2026-03-29T00:55Z'), reading(2, '2026-03-29T01:05Z'),
  ], '2026-03-23', zone);
  assert.equal(spring.sessions[0].time, '01:55');
  assert.equal(spring.sessions[0].items.length, 2);
  assert.equal(localClock(Date.parse('2026-03-29T01:05Z'), zone).time, '03:05');
  const autumn = buildAmpaReport([
    reading(2, '2026-10-25T01:15Z'), reading(1, '2026-10-25T00:15Z'),
  ], '2026-10-19', zone);
  assert.deepEqual(autumn.sessions.map(s => [s.time, s.items[0].id]), [['02:15', 1], ['02:15', 2]]);
});

const profile = { name: 'Fernando', birthDate: '1971-11-30', medication: 'Enalapril 10',
  monitor: 'AILE', arm: 'Izquierdo' } as const;
const now = new Date('2026-11-22T23:30Z');
const pdfText = (bytes: ArrayBuffer) => Buffer.from(bytes).toString('latin1');

test('PDF A4 de dos páginas con texto seleccionable, pie y nombre', () => {
  const pdf = renderAmpaPdf(report, profile, 'Tensia', now);
  assert.equal(pdf.filename, 'AMPA_2026-11-16_2026-11-22.pdf');
  const text = pdfText(pdf.bytes);
  assert.equal((text.match(/\/Type \/Page\b/g) ?? []).length, 2);
  assert.match(text, /\/MediaBox \[0 0 595\.\d+ 841\./);
  for (const label of ['Hoja de registro', 'Notas y observaciones', '28 \\(72 %\\)', '138/84 mmHg',
    '23/11/2026 con Tensia', 'Pág. 1/2', 'Pág. 2/2', 'Mié 18/11', '134/80 \\(n=4\\)']) {
    assert.ok(text.includes(label), label);
  }
  assert.equal(text.split('(Lun 16/11)').length - 1, 1);
  assert.equal(text.split('(Mar 17/11)').length - 1, 1);
  assert.ok(text.includes('(142/83*)'));
  assert.ok(text.includes('(73* / 67 / 65)'));
  for (const label of ['(Fernando)', '(30/11/1971)', '(Enalapril 10)', '(AILE)', '(Izquierdo)',
    'Resumen de la semana', 'Media de mañana', 'Media de noche', '137/83 mmHg',
    'Lecturas registradas: 39 en 12 sesiones', 'Evolución de la semana']) {
    assert.ok(text.includes(label), label);
  }
  assert.doesNotMatch(text, /\/Subtype \/Image/);
});

test('PDF largo repite la cabecera en las páginas con filas', () => {
  const items = Array.from({ length: 58 }, (_, i) =>
    reading(i, new Date(Date.parse('2026-11-16T09:00Z') + i * 1_200_000).toISOString()));
  const text = pdfText(renderAmpaPdf(buildAmpaReport(items, monday, zone), profile, 'Tensia', now).bytes);
  assert.ok((text.match(/\/Type \/Page\b/g) ?? []).length > 2);
  assert.equal(text.split('(Lun 16/11)').length - 1, 2);
  assert.ok((text.match(/\(Lectura 1\)/g) ?? []).length > 1);
  assert.equal(text.split('138/80 \\(n=1\\)').length - 1, 58);
});

test('solo mañana y noche filtra tomas, resumen y PDF', () => {
  const selected = buildAmpaReport(fixture, monday, zone, undefined, 'morning-night');
  assert.deepEqual([selected.readingCount, selected.sessions.length, selected.highCount, selected.highPercent],
    [36, 11, 28, 78]);
  assert.deepEqual(selected.summaries.map(s => s.label),
    ['Media de mañana', 'Media de noche', 'Media semanal (mañana y noche)']);
  assert.equal(show(selected.morningNight.average!), '138/84');
  const text = pdfText(renderAmpaPdf(selected, profile, 'Tensia', now).bytes);
  assert.match(text, /Franjas: Solo mañana y noche/);
  assert.doesNotMatch(text, /\(Tarde\)|Media de tarde/);
  assert.equal(buildAmpaReport(fixture.filter(r => r.period === 'Tarde'),
    monday, zone, undefined, 'morning-night').sessions.length, 0);
});

test('excluye solo la primera toma de cada sesión de tres o más', () => {
  const items = [1, 2, 3, 4, 5].flatMap((count, hour) =>
    Array.from({ length: count }, (_, minute) => ({
      ...reading(hour * 10 + minute, new Date(Date.UTC(2026, 10, 16, 9 + hour, minute)).toISOString()),
      systolic: minute === 0 ? 160 : 120,
    })));
  const result = buildAmpaReport(items, monday, zone);
  assert.deepEqual(result.sessions.map(s => [s.omitFirst, s.usedCount, s.average.systolic]),
    [[false, 1, 160], [false, 2, 140], [true, 2, 120], [true, 3, 120], [true, 4, 120]]);
  assert.equal(result.highCount, 5);
  assert.equal(result.morningNight.average!.systolic, 132);
});

test('selecciona la semana actual con datos o la más próxima, priorizando la pasada en empate', () => {
  const weeks = ['2026-11-02', '2026-11-23'];
  assert.equal(closestAmpaWeek(weeks, '2026-11-24'), '2026-11-23');
  assert.equal(closestAmpaWeek(weeks, '2026-11-15'), '2026-11-02');
  assert.equal(closestAmpaWeek(weeks, '2026-11-16'), '2026-11-23');
  assert.equal(closestAmpaWeek([], '2026-11-16'), '');
});

test('las semanas disponibles usan las franjas elegidas y el inicio local de la sesión', () => {
  const items = [
    reading(1, '2026-11-22T22:55Z'),
    reading(2, '2026-11-22T23:05Z'),
    reading(3, '2026-11-30T13:00Z', 'Tarde'),
  ];
  assert.deepEqual(availableAmpaWeeks(items, zone, 'all'), ['2026-11-30', '2026-11-16']);
  assert.deepEqual(availableAmpaWeeks(items, zone, 'morning-night'), ['2026-11-16']);
  assert.deepEqual(availableAmpaWeeks(items.slice(2), zone, 'morning-night'), []);
});

test('PDF general filtra fechas locales inclusivas y repite la cabecera al paginar', async () => {
  const { localReadings, readingsInRange, renderReadingsPdf } = await import('../src/services/pdfService.ts');
  const input = [
    reading(3, '2026-11-17T23:00Z'),
    reading(2, '2026-11-17T22:59Z'),
    reading(1, '2026-11-16T23:00Z'),
  ];
  const dates = localReadings(input, zone);
  const selected = readingsInRange(dates, '2026-11-17', '2026-11-17');
  assert.deepEqual(selected.map(r => [r.id, r.time]), [[1, '00:00'], [2, '23:59']]);
  assert.deepEqual(readingsInRange(dates, '2026-11-16', '2026-11-16'), []);
  const { bytes, filename } = renderReadingsPdf(Array.from({ length: 45 }, () => selected[0]),
    profile, '2026-11-17', '2026-11-17', 'Tensia', '2026-11-23');
  const text = pdfText(bytes);
  assert.equal(filename, 'Tensia-Informe_2026-11-17_2026-11-17.pdf');
  assert.equal((text.match(/\/Type \/Page\b/g) ?? []).length, 2);
  assert.equal(text.split('(17/11/2026)').length - 1, 2);
  assert.equal(text.split('(Franja)').length - 1, 2);
  assert.match(text, /\(Fernando\)/);
});
