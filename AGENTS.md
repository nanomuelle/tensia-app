# Guía para agentes

Empieza por el [índice de documentación](docs/README.md) y abre solo las fichas relevantes para la tarea. Usa sus enlaces para contrastar reglas y flujos con el código y las pruebas actuales. Al cambiar un flujo, actualiza su ficha; evita duplicar reglas entre páginas.

## Código

- Entrada en `src/main.tsx` y pantalla principal en `src/App.tsx`. Coloca UI reutilizable en `src/components/`, estado React y flujos del navegador en `src/hooks/`, y datos, validación, Gemini y PDF en `src/services/`.
- Usa dos espacios y sigue el estilo de comillas y punto y coma del archivo. Nombra los componentes en PascalCase y los hooks con prefijo `use`. Usa utilidades de Tailwind y mantén los textos de interfaz en español.

## Verificación y cambios

- Sigue la [guía de entorno y pruebas](docs/desarrollo/entorno-y-pruebas.md). Compila y verifica los flujos afectados. Para almacenamiento y copias, usa tomas sintéticas y comprueba recarga, exportación e importación; para PWA, usa el preview de producción.
- Usa mensajes de commit breves y acotados. En una PR resume los cambios, enlaza la incidencia si existe e indica las comprobaciones realizadas. Si cambia la interfaz, incluye capturas con datos sintéticos. No subas claves, datos personales ni archivos locales de entorno.
