# Reconocimiento por foto con Gemini

## Flujo

1. Abre **Foto y listo**. Si no hay clave de Gemini, se abre su configuración; el botón con icono de llave permite volver a ella. Se puede probar la clave mediante una solicitud a Gemini.
2. La primera vez que se accede con clave, hay que aceptar el aviso de privacidad. Cancelar no abre el selector. Tras aceptar, se puede tomar una foto o elegir una imagen de la galería; las opciones efectivas dependen del navegador y dispositivo.
3. La app comprime la imagen en el navegador (JPEG, lado mayor de hasta 1024 px) y la envía a Gemini. En caso de éxito, abre el formulario con sistólica, diastólica, pulso, hora actual y una nota de captura. Verifica las cifras y pulsa **Guardar** si son correctas: recibir un resultado no crea una toma por sí solo.
4. Si falla la preparación de la imagen, la solicitud o la interpretación de la respuesta, se muestra un error en el formulario. Siempre se puede introducir la lectura manualmente.

## Reglas y datos

El análisis requiere conexión. El navegador envía a Google la imagen comprimida y la instrucción de extracción, con la clave en el parámetro de la solicitud. La comprobación de clave envía una pregunta de prueba sin foto. El flujo no guarda la imagen en IndexedDB: guarda la clave en la tabla de ajustes y el consentimiento en `localStorage`. Las cifras propuestas pasan por la [validación habitual](mediciones.md) al guardar; el servicio no garantiza una interpretación correcta de la foto.

## Código y verificación

- [Configuración de clave](../../src/components/ApiKeyModal.tsx), [aviso de privacidad](../../src/components/PrivacyModal.tsx), [selector](../../src/components/PhotoCaptureModal.tsx), [hook de clave](../../src/hooks/useApiKey.ts), [flujo](../../src/hooks/useGeminiAI.ts) y [solicitud a Gemini](../../src/services/geminiService.ts).
- **Comprobación manual:** revisar las ramas sin clave, sin consentimiento, con error y con éxito; usar solo una imagen sintética sin información identificable para una solicitud real. Comprobar que cerrar el formulario sin guardar no añade la lectura.
