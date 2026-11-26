import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeBloodPressureImage, testGeminiApiKey } from '../src/services/geminiService.ts';

const reading = { systolic: 132, diastolic: 81, pulse: 64 };
const candidate = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] });

test('probar una clave hace un POST sin imagen con la clave recortada y codificada', async ({ mock }) => {
  const fetch = mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    assert.match(url, /^https:\/\/generativelanguage\.googleapis\.com\/.+:generateContent\?key=clave%2Bprueba$/);
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(String(init.body)).contents, [{ parts: [{ text: 'Ping test. Respond with OK.' }] }]);
    return Response.json(candidate('OK'));
  });
  assert.equal(await testGeminiApiKey('  clave+prueba  '), true);
  assert.equal(fetch.mock.callCount(), 1);
});

test('envía JPEG y solicita los tres campos; devuelve sus valores numéricos', async ({ mock }) => {
  mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    assert.match(url, /\?key=clave%2Bprueba$/);
    assert.equal(init.method, 'POST');
    const body = JSON.parse(String(init.body));
    assert.deepEqual(body.contents[0].parts[1], { inline_data: { mime_type: 'image/jpeg', data: 'YWJj' } });
    assert.equal(body.generationConfig.response_mime_type, 'application/json');
    assert.deepEqual(body.generationConfig.response_schema.required, ['systolic', 'diastolic', 'pulse']);
    return Response.json(candidate(JSON.stringify(reading)));
  });
  assert.deepEqual(await analyzeBloodPressureImage('  clave+prueba  ', 'YWJj'), reading);
});

test('rechaza una clave vacía sin llamar a la red', async ({ mock }) => {
  const fetch = mock.method(globalThis, 'fetch', async () => { throw new Error('Solicitud inesperada'); });
  await assert.rejects(testGeminiApiKey(' '), /no puede estar vacía/);
  await assert.rejects(analyzeBloodPressureImage(' ', 'YWJj'), /no configurada/);
  assert.equal(fetch.mock.callCount(), 0);
});

for (const [name, request] of [['probar clave', () => testGeminiApiKey('clave')],
  ['analizar imagen', () => analyzeBloodPressureImage('clave', 'YWJj')]] as const) {
  test(`${name}: propaga los errores HTTP y de red`, async ({ mock }) => {
    mock.method(globalThis, 'fetch', async () => Response.json({ error: { message: 'Cuota agotada' } }, { status: 429 }), { times: 1 });
    await assert.rejects(request(), /Cuota agotada/);
    mock.method(globalThis, 'fetch', async () => new Response('no es JSON', { status: 503, statusText: 'Unavailable' }), { times: 1 });
    await assert.rejects(request(), /503.*Unavailable/);
    mock.method(globalThis, 'fetch', async () => { throw new TypeError('Sin red'); }, { times: 1 });
    await assert.rejects(request(), /Sin red/);
  });
}

for (const [response, expected] of [[{ candidates: [] }, /no contiene contenido válido/],
  [candidate('no es JSON'), /No se pudo interpretar/],
  [candidate(JSON.stringify({ ...reading, pulse: 'desconocido' })), /no son números válidos/]] as const) {
  test(`rechaza respuestas inválidas: ${expected.source}`, async ({ mock }) => {
    mock.method(globalThis, 'fetch', async () => Response.json(response));
    await assert.rejects(analyzeBloodPressureImage('clave', 'YWJj'), expected);
  });
}
