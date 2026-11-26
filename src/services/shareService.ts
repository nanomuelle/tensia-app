import type { BloodPressureRecord } from './db.ts';
import { APP_NAME } from '../appConfig.ts';

export async function shareReadings(
  readings: readonly BloodPressureRecord[],
  share: ((data: ShareData) => Promise<void>) | undefined,
  openMail: (url: string) => void,
): Promise<void> {
  const summary = readings.slice(0, 5).map(r => `${new Date(r.timestamp).toLocaleDateString()} (${r.period}): ${r.systolic}/${r.diastolic} mmHg`).join('\n');
  const text = `Tensión Arterial (${APP_NAME}):\n${summary}`;
  if (share) {
    try {
      await share({ title: APP_NAME, text });
    } catch {
      // Cancelar o fallar en el selector nativo no debe abrir otro destino.
    }
  } else {
    openMail(`mailto:?subject=Tensión&body=${encodeURIComponent(text)}`);
  }
}
