import type { jsPDF } from 'jspdf';
import type { AmpaProfile } from './settingsService';
import { displayDate } from './ampaReport.ts';

export function drawPatientHeader(doc: jsPDF, profile: AmpaProfile, measurement: string, y: number) {
  function text(value: string, x: number, baseline: number, size = 9, bold = false) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.text(value, x, baseline);
  }
  const left = 14;
  const profileRows = [
    [['Nombre', profile.name], ['Fecha de nacimiento', displayDate(profile.birthDate)]],
    [['Medicación', profile.medication], ['Tensiómetro', profile.monitor]],
    [['Brazo usado', profile.arm], ['Tipo de medida', measurement]],
  ];
  for (const pair of profileRows) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = pair.map(([, value]) => doc.splitTextToSize(value, 56) as string[]);
    pair.forEach(([label], i) => {
      const x = left + i * 91;
      text(label, x, y + 3, 9, true);
      lines[i].forEach((line, j) => text(line, x + 34, y + 3 + j * 4));
    });
    y += Math.max(...lines.map(line => line.length)) * 4 + 2;
  }

  return y;
}
