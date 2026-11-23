import { jsPDF } from 'jspdf';
import { displayDate, localClock } from './ampaReport.ts';
import { drawPatientHeader } from './pdfPatientHeader.ts';
import type { BloodPressureRecord } from './db';
import type { AmpaProfile } from './settingsService';

export function localReadings(readings: readonly BloodPressureRecord[], timeZone: string) {
  return readings.map(reading => {
    const instant = Date.parse(reading.timestamp);
    return { ...reading, ...localClock(instant, timeZone), instant };
  }).sort((a, b) => a.instant - b.instant || (a.id ?? 0) - (b.id ?? 0));
}

export function readingsInRange(readings: ReturnType<typeof localReadings>, from: string, to: string) {
  return readings.filter(reading => reading.date >= from && reading.date <= to);
}

export function renderReadingsPdf(
  readings: ReturnType<typeof localReadings>, profile: AmpaProfile,
  from: string, to: string, appName: string, generatedDate: string,
) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  let y = 14;
  const left = 14;
  const widths = [32, 22, 27, 36, 36, 29];
  const height = 7;
  function text(value: string, x: number, baseline: number, size = 9, bold = false) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.text(value, x, baseline);
  }
  function row(values: string[], firstColumn = 0, bold = false) {
    let x = left + (firstColumn ? widths[0] : 0);
    doc.setDrawColor(170);
    doc.setLineWidth(0.2);
    values.forEach((value, index) => {
      const width = widths[firstColumn + index];
      doc.rect(x, y, width, height);
      text(value, x + 2, y + 4.7, 8, bold);
      x += width;
    });
    y += height;
  }
  const heading = () => row(['Fecha', 'Hora', 'Franja', 'Sistólica (mmHg)', 'Diastólica (mmHg)', 'Pulso (lpm)'], 0, true);

  text('Informe de lecturas de presión arterial', left, y + 4, 15, true);
  text(`Del ${displayDate(from)} al ${displayDate(to)} · Total de lecturas: ${readings.length}`, left, y + 11, 11);
  y = drawPatientHeader(doc, profile, 'Domiciliaria', y + 17) + 3;
  heading();

  let date = '';
  let blockTop = y;
  function finishDate() {
    if (!date) return;
    doc.rect(left, blockTop, widths[0], y - blockTop);
    text(displayDate(date), left + 2, blockTop + (y - blockTop) / 2 + 1, 8);
  }

  for (const reading of readings) {
    if (y + height > 272) {
      finishDate();
      doc.addPage();
      y = 14;
      heading();
      date = '';
    }
    if (date !== reading.date) {
      finishDate();
      date = reading.date;
      blockTop = y;
    }
    row([reading.time, reading.period, String(reading.systolic), String(reading.diastolic), String(reading.pulse)], 1);
  }
  finishDate();

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    text(`Informe orientativo generado el ${displayDate(generatedDate)} con ${appName}.`, left, 281, 8);
    text(`Pág. ${page}/${pages}`, 183, 287, 8);
  }
  return { bytes: doc.output('arraybuffer'), filename: `Tensia-Informe_${from}_${to}.pdf` };
}
