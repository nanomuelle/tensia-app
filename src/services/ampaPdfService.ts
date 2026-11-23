import { drawPatientHeader } from './pdfPatientHeader.ts';
import { jsPDF } from 'jspdf';
import { addDays, displayDate, isHigh, localClock, rounded } from './ampaReport.ts';
import type { AmpaReport } from './ampaReport.ts';
import type { AmpaProfile } from './settingsService';

const boldHighSessionMean = false;
const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const shortDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const left = 14;
const width = 182;
const bottom = 272;
const pressure = (v: { systolic: number; diastolic: number }) =>
  `${rounded(v.systolic)}/${rounded(v.diastolic)}`;

export function renderAmpaPdf(report: AmpaReport, profile: AmpaProfile, appName: string, generatedAt: Date) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  let y = 14;

  function text(value: string, x: number, baseline: number, size = 9, bold = false) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.text(value, x, baseline);
  }

  function nextPage() {
    doc.addPage();
    y = 14;
  }

  function reserve(height: number) {
    if (y + height > bottom) nextPage();
  }

  function row(values: string[], widths: number[], bold: boolean[] = [], height = 7, startX = left) {
    let x = startX;
    doc.setDrawColor(170);
    doc.setLineWidth(0.2);
    values.forEach((value, i) => {
      doc.rect(x, y, widths[i], height);
      text(value, x + 1.4, y + height / 2 + 1, 8, bold[i]);
      x += widths[i];
    });
    y += height;
  }

  text('Hoja de registro de automedida de la presión arterial (AMPA)', left, y + 4, 15, true);
  text(`Semana del ${displayDate(report.monday)} al ${displayDate(report.sunday)}`, left, y + 11, 11);
  text(report.periods === 'all' ? 'Franjas: Mañana, tarde y noche' : 'Franjas: Solo mañana y noche', left, y + 16);
  y += 21;
  y = drawPatientHeader(doc, profile, 'Domiciliaria (AMPA)', y);

  y += 3;
  const columns = [23, 19, 14, 19, 19, 19, 30, 39];
  const heading = () => row(
    ['Fecha', 'Franja', 'Hora', 'Lectura 1', 'Lectura 2', 'Lectura 3', 'Media (n)', 'Pulso (lect. 1-3)'],
    columns, Array(8).fill(true),
  );
  const offset = (date: string) => (Date.parse(date) - Date.parse(report.monday)) / 86400000;
  reserve(14);
  heading();
  const dateWidth = columns[0];
  const sessionWidths = columns.slice(1);
  const sessionHeight = 7;
  let blockDate = '';
  let blockTop = y;

  function finishDateBlock() {
    if (!blockDate) return;
    doc.setDrawColor(170);
    doc.setLineWidth(0.2);
    doc.rect(left, blockTop, dateWidth, y - blockTop);
    text(`${days[offset(blockDate)]} ${displayDate(blockDate).slice(0, 5)}`,
      left + 1.4, blockTop + (y - blockTop) / 2 + 1, 8);
  }

  for (const session of report.sessions) {
    if (y + sessionHeight > bottom) {
      finishDateBlock();
      nextPage();
      heading();
      blockDate = '';
    }
    if (blockDate !== session.date) {
      finishDateBlock();
      blockDate = session.date;
      blockTop = y;
    }
    const visible = [session.items[0], session.items[1], session.items[2]];
    const mark = (index: number) => session.omitFirst && index === 0 ? '*' : '';
    row([
      session.period, session.time, ...visible.map((v, i) => v ? pressure(v) + mark(i) : ''),
      `${pressure(session.average)} (n=${session.usedCount})`,
      visible.filter(Boolean).map((v, i) => String(v.pulse) + mark(i)).join(' / '),
    ], sessionWidths, [false, false, ...visible.map(v => !!v && isHigh(v.systolic, v.diastolic)),
      boldHighSessionMean && isHigh(session.average.systolic, session.average.diastolic)],
      sessionHeight, left + dateWidth);
  }
  finishDateBlock();

  function paragraph(value: string, size: number, lineHeight: number, x = left, maxWidth = width) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(value, maxWidth);
    reserve(lines.length * lineHeight);
    for (const line of lines) {
      text(line, x, y + lineHeight - 1, size);
      y += lineHeight;
    }
  }

  y += 2;
  paragraph('Negrita: lectura de 135/85 mmHg o más. * Primera toma excluida de la media en sesiones de 3 o más. n: tomas usadas en la media, incluidas las posteriores a la tercera, que no se muestran.', 8, 4);
  y += 3;
  reserve(14 + report.summaries.length * 7);
  text('Resumen de la semana', left, y + 4, 11, true);
  y += 7;
  const summaryWidths = [83, 38, 33, 28];
  row(['', 'Presión media', 'Pulso medio', 'Sesiones'], summaryWidths, Array(4).fill(true));
  for (const { label, average, count } of report.summaries) {
    row([label, average ? `${pressure(average)} mmHg` : '—',
      average ? String(rounded(average.pulse)) : '—', String(count)], summaryWidths);
  }

  y += 4;
  reserve(55);
  text('Evolución de la semana (media de cada sesión)', left, y + 4, 11, true);
  const x0 = left + 11;
  const plotWidth = 159;
  const top = y + 9;
  const plotHeight = 32;
  const values = report.sessions.flatMap(({ average }) => [average.systolic, average.diastolic]);
  const low = Math.floor(Math.min(60, ...values) / 20) * 20;
  const high = Math.ceil(Math.max(160, ...values) / 20) * 20;
  const plotY = (value: number) => top + plotHeight * (high - value) / (high - low);
  doc.setLineWidth(0.15);
  for (let tick = low; tick <= high; tick += 20) {
    doc.setDrawColor(218);
    doc.line(x0, plotY(tick), x0 + plotWidth, plotY(tick));
    text(String(tick), left, plotY(tick) + 1, 7);
  }
  for (const limit of [135, 85]) {
    doc.setDrawColor(115);
    doc.setLineDashPattern([1.5, 1], 0);
    doc.line(x0, plotY(limit), x0 + plotWidth, plotY(limit));
    text(String(limit), x0 + plotWidth + 2, plotY(limit) + 1, 7);
  }
  doc.setLineDashPattern([], 0);
  shortDays.forEach((day, i) => text(
    `${day} ${addDays(report.monday, i).slice(-2)}`, x0 + plotWidth * i / 7, top + plotHeight + 4, 8,
  ));

  for (const key of ['systolic', 'diastolic'] as const) {
    const systolic = key === 'systolic';
    const color: [number, number, number] = systolic ? [21, 57, 103] : [151, 64, 9];
    doc.setDrawColor(...color);
    doc.setFillColor(...color);
    doc.setLineWidth(systolic ? 0.55 : 0.35);
    function marker(x: number, pointY: number) {
      if (systolic) doc.circle(x, pointY, 0.85, 'F');
      else doc.rect(x - 0.8, pointY - 0.8, 1.6, 1.6, 'F');
    }
    let previous: [number, number] | undefined;
    for (const session of report.sessions) {
      const x = x0 + plotWidth * (offset(session.date) + session.dayFraction) / 7;
      const pointY = plotY(session.average[key]);
      if (previous) doc.line(...previous, x, pointY);
      marker(x, pointY);
      previous = [x, pointY];
    }
    const legendX = systolic ? x0 : x0 + 40;
    marker(legendX, y + 50);
    text(systolic ? 'Sistólica (alta)' : 'Diastólica (baja)', legendX + 3, y + 51, 8);
  }
  text('Límites en casa: 135 y 85 mmHg', x0 + 84, y + 51, 8);

  nextPage();
  text('Notas y observaciones', left, y + 5, 15, true);
  y += 11;
  const weekly = report.morningNight.average;
  if (weekly) {
    const status = isHigh(weekly.systolic, weekly.diastolic) ? 'por encima del límite' : 'dentro del límite';
    paragraph(`• La media semanal (mañana y noche) es ${pressure(weekly)} mmHg, ${status} de 135/85 mmHg para medidas en casa.`, 10, 5);
    y += 2;
  }
  paragraph(`• Lecturas registradas: ${report.readingCount} en ${report.sessions.length} sesiones. Lecturas de 135/85 mmHg o más: ${report.highCount} (${report.highPercent} %).`, 10, 5);

  const date = displayDate(localClock(generatedAt, report.timeZone).date);
  const footer = `Informe orientativo generado el ${date} con ${appName}. No es un diagnóstico ni sustituye la valoración médica. Referencia: ESH 2023 y ESC 2024 (medida domiciliaria: 135/85 mmHg).`;
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(7);
    const lines: string[] = doc.splitTextToSize(footer, width);
    lines.forEach((line, i) => text(line, left, 278 + i * 3, 7));
    text(`Pág. ${page}/${pages}`, 183, 288, 7);
  }
  return {
    bytes: doc.output('arraybuffer'),
    filename: `AMPA_${report.monday}_${report.sunday}.pdf`,
  };
}
