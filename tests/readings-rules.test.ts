import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCategory, getPeriod, validateReading } from '../src/services/readingsService.ts';

const ranges = [
  { min: 40, max: 250, message: 'Sistólica entre 40 y 250.' },
  { min: 20, max: 160, message: 'Diastólica entre 20 y 160.' },
  { min: 10, max: 250, message: 'Pulso entre 10 y 250.' },
];

for (const [index, { min, max, message }] of ranges.entries()) {
  test(`valida los límites inclusivos: ${message}`, () => {
    for (const [value, valid] of [[min, true], [max, true], [min - 1, false], [max + 1, false], [NaN, false]] as const) {
      const input: [number, number, number] = [120, 80, 70];
      input[index] = value;
      assert.deepEqual(validateReading(...input), valid ? { isValid: true } : { isValid: false, error: message }, String(value));
    }
  });
}

test('las franjas cambian a las 06:00, 12:00 y 20:00 locales', () => {
  for (const [hour, minute, expected] of [[5, 59, 'Noche'], [6, 0, 'Mañana'], [11, 59, 'Mañana'],
    [12, 0, 'Tarde'], [19, 59, 'Tarde'], [20, 0, 'Noche']] as const) {
    assert.equal(getPeriod(new Date(2026, 10, 23, hour, minute)), expected, `${hour}:${minute}`);
  }
});

test('aplica las categorías en orden, incluidos los umbrales dispares', () => {
  for (const [systolic, diastolic, expected] of [[119, 79, 'Óptima'], [120, 80, 'Normal'], [129, 84, 'Normal'],
    [139, 89, 'Normal-Alta'], [159, 99, 'Grado 1'], [179, 109, 'Grado 2'], [180, 110, 'Grado 3'],
    [180, 89, 'Normal-Alta'], [139, 110, 'Normal-Alta']] as const) {
    assert.equal(getCategory(systolic, diastolic).label, expected, `${systolic}/${diastolic}`);
  }
});
