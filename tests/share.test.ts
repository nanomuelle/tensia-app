import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shareReadings } from '../src/services/shareService.ts';
import type { BloodPressureRecord } from '../src/services/db.ts';

const record: BloodPressureRecord = {
  systolic: 132, diastolic: 81, pulse: 64, timestamp: new Date(2026, 10, 23, 12).toISOString(), period: 'Tarde', notes: 'No compartir',
};
const summary = `Tensión Arterial (Tensia):\n${new Intl.DateTimeFormat().format(new Date(2026, 10, 23, 12))} (Tarde): 132/81 mmHg`;

test('sin Web Share abre un correo con el asunto y el resumen, sin adjuntos', async () => {
  const links: URL[] = [];
  await shareReadings([record], undefined, link => links.push(new URL(link)));
  assert.equal(links.length, 1);
  assert.equal(links[0].protocol, 'mailto:');
  assert.equal(links[0].pathname, '');
  assert.deepEqual([...links[0].searchParams], [['subject', 'Tensión'], ['body', summary]]);
});

for (const error of [new DOMException('Cancelado', 'AbortError'), new Error('Sin selector nativo')]) {
  test(`no abre correo si Web Share rechaza: ${error.name}`, async () => {
    const payloads: ShareData[] = [];
    await shareReadings([record], async payload => {
      payloads.push(payload);
      throw error;
    }, () => assert.fail('Web Share ya se intentó: no debe abrir el correo'));
    assert.deepEqual(payloads, [{ title: 'Tensia', text: summary }]);
  });
}
