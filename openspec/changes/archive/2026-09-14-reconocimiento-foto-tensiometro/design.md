## Context

Ver `proposal.md` para la motivación y el alcance general. La aplicación es una PWA 100% cliente-side construida con React, Vite, Tailwind CSS y Dexie (IndexedDB). No existe servidor backend. La integración con la API de Gemini se realizará mediante llamadas directas `fetch` desde el navegador utilizando la clave de API proporcionada y almacenada localmente por el usuario (BYOK).

## Goals / Non-Goals

**Goals:**
- Integrar el flujo de captura fotográfica y reconocimiento OCR estructurado mediante Gemini Vision API sin introducir dependencias de servidor ni SDKs pesados.
- Almacenar de forma local la clave de API del usuario.
- Proporcionar una pantalla de confirmación editable con validaciones robustas antes de guardar la lectura.
- Mostrar aviso de privacidad claro en el primer uso.

**Non-Goals:**
- Almacenar las fotografías en la base de datos o en servidor (se procesan en memoria en el cliente y se descartan inmediatamente).
- Soporte para proveedores distintos a Google Gemini.

## Decisions

### Decision 1: Almacenamiento local de la API Key en IndexedDB
- **Choice**: Añadir una tabla o registro de configuración (`settings` store) en Dexie para guardar la clave de API en texto plano (sin cifrar) en el almacenamiento del navegador del usuario.
- **Rationale**: Mantiene la arquitectura offline-first y 100% cliente-side sin requerir backend.
- **Alternatives considered**: `localStorage` (menos estructurado, pero viable; IndexedDB se alinea con el resto de los datos de la app).

### Decision 2: Comunicación directa con Gemini Vision REST API
- **Choice**: Uso de `fetch` nativo al endpoint `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=<api_key>` (o modelo flash equivalente con visión). *Nota: Verificar en Google AI Studio el nombre de modelo vigente antes de implementar, dado que Google retira modelos con frecuencia.*
- **Rationale**: Evita añadir SDKs pesados (`@google/genai`) manteniendo el bundle ligero y el rendimiento óptimo en móviles.
- **Alternatives considered**: SDK oficial de Google Gen AI (añade peso innecesario al bundle para una llamada REST sencilla).

### Decision 3: Formato estructurado JSON mediante esquema de respuesta
- **Choice**: Configurar el payload de Gemini con `response_mime_type: "application/json"` y esquema JSON solicitando `{ "systolic": number, "diastolic": number, "pulse": number }`.
- **Rationale**: Garantiza que la respuesta de la IA sea directamente parseable por el cliente sin depender de heurísticas de regex complejas sobre texto libre.
- **Alternatives considered**: Extracción por expresiones regulares sobre texto libre (frágil ante variaciones en la respuesta de la IA).

### Decision 4: Redimensión y compresión de imagen en el cliente
- **Choice**: Redimensionar la imagen capturada a un máximo de 1024px en su lado mayor y comprimirla a formato JPEG con calidad aproximada de 0.8 en el cliente antes de convertirla a base64 para el envío a Gemini.
- **Rationale**: Reduce significativamente el tiempo de red, el consumo de datos y el uso de cuota de la API de visión sin afectar la legibilidad de los dígitos del tensiómetro.
- **Alternatives considered**: Enviar la imagen original sin comprimir (provoca payloads excesivamente grandes y tiempos de carga elevados en conexiones lentas).

## Risks / Trade-offs

- [Conectividad y Disponibilidad de la API] → La función requiere conexión a internet para contactar con Gemini. *Mitigación*: Indicador claro de error de red y opción de fallback inmediato a entrada manual.
- [Clave de API inválida o cuota agotada] → El usuario puede introducir una clave errónea o quedarse sin cuota gratuita. *Mitigación*: Botón de prueba de clave en la pantalla de configuración y mensajes de error descriptivos.
- [Calidad de la foto o reflejos en la pantalla del tensiómetro] → Fotos borrosas o con flash reflejado pueden dificultar el OCR. *Mitigación*: Permite edición manual instantánea de todos los campos extraídos antes de guardar.
- [Seguridad de la Clave API] → La clave de API se guarda sin cifrar en IndexedDB; riesgo aceptado por ser almacenamiento local no sincronizado, sin backend que la exponga. *Mitigación*: Explicar al usuario en la interfaz que su clave reside exclusivamente en su dispositivo.
