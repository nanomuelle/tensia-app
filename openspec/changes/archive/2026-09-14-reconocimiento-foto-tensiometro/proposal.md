## Why

Los usuarios de la aplicación (especialmente adultos mayores y pacientes con monitorización frecuente) necesitan agilizar la introducción de lecturas de tensión arterial sin depender exclusivamente de la entrada manual de cada valor. La función de reconocimiento automático por foto ("Foto y listo") utilizando su propia clave de API de Gemini (BYOK) permite escanear la pantalla del tensiómetro directamente desde el dispositivo sin requerir backend propio ni comprometer la arquitectura cliente-libre.

## What Changes

- **Nueva pantalla de configuración API (Gemini BYOK)**: Permite introducir, probar mediante llamada de test, y almacenar localmente (IndexedDB) la clave de API de Gemini.
- **Botón "Foto y listo" en alta de lectura**: Añade un acceso directo en el modal de nueva toma o pantalla principal para capturar/seleccionar una foto de la pantalla del tensiómetro.
- **Cliente Vision API de Gemini**: Envío directo desde el navegador (fetch nativo) de la imagen comprimida y redimensionada junto con un prompt estructurado para extraer sistólica, diastólica y pulso.
- **Pantalla de confirmación y validación**: Muestra los valores extraídos en campos editables aplicando las mismas validaciones de rango que la entrada manual antes de persistir la lectura.
- **Manejo robusto de errores y reintentos**: Mensajes claros ante falta de clave, errores de red, cuota excedida o fallos de interpretación de la imagen, con fallback fluido a entrada manual.
- **Aviso de privacidad explícito**: Muestra un aviso la primera vez que se activa la función sobre el envío de imágenes a Google y su no almacenamiento en servidores propios.

## Capabilities

### New Capabilities
- `gemini-vision-recognition`: Reconocimiento automático de lecturas de tensión arterial mediante captura fotográfica usando la API de Gemini Vision (BYOK).

### Modified Capabilities
- `blood-pressure-tracker`: Ampliación del flujo de alta de lecturas para incorporar la opción de captura fotográfica por IA, gestión de configuración de clave API y validación previa a guardado.

## Impact

- **Código**: Nuevos componentes o vistas para configuración de clave API y captura/recorte/procesamiento de imagen en el cliente (`src/services/gemini.ts`, `src/components/ApiKeyModal.tsx`, `src/components/PhotoCaptureModal.tsx`, `src/components/PhotoConfirmModal.tsx`).
- **Base de Datos (IndexedDB)**: Ampliación de Dexie (o nueva tabla/store para configuración segura local como metadatos/configuración).
- **Dependencias**: Ninguna librería adicional de backend ni SDK pesado; se usa `fetch` nativo del navegador.
- **Privacidad / Seguridad**: Manejo local de la API key en IndexedDB del navegador del usuario.
