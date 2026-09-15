import { jsPDF } from 'jspdf';
import { BloodPressureRecord } from './readingsService';

export function generateReadingsPDF(readings: BloodPressureRecord[]): void {
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
