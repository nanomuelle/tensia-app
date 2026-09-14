## 1. Configuración de Base de Datos y Almacenamiento Local de API Key

- [x] 1.1 Ampliar el esquema de Dexie en `src/db.ts` para incluir una tabla `settings` o equivalente para almacenar la clave de API de Gemini y verificar que compila correctamente.
- [x] 1.2 Implementar funciones auxiliares para guardar, recuperar y eliminar la clave de API de Gemini en `src/db.ts`, verificando su persistencia en IndexedDB.

## 2. Cliente de Gemini Vision y Servicio de OCR

- [ ] 2.1 Redimensionar y comprimir la imagen capturada (máx. 1024px, JPEG ~0.8 calidad) antes de convertirla a base64 para el envío a Gemini.
- [ ] 2.2 Crear el servicio `src/services/gemini.ts` con la función de llamada REST directa a Gemini Vision usando `fetch` y validación de respuesta estructurada en JSON (`systolic`, `diastolic`, `pulse`).
- [ ] 2.3 Implementar la función de prueba de API key en `src/services/gemini.ts` y verificar que devuelve éxito ante una clave válida y error descriptivo ante una inválida.

## 3. Componentes de Interfaz de Usuario y Privacidad

- [ ] 3.1 Crear el modal de configuración de la clave API de Gemini in `src/components/ApiKeyModal.tsx` con campo de clave, botón de test y guardado.
- [ ] 3.2 Implementar el aviso de privacidad de IA en el primer uso al pulsar "Foto y listo" con confirmación de aceptación.
- [ ] 3.3 Crear el modal de captura/selección de foto (`PhotoCaptureModal.tsx`) y previsualización/confirmación editable o integrado en el flujo de alta de lectura.

## 4. Integración y Validación End-to-End

- [ ] 4.1 Integrar el botón "Foto y listo" y el acceso a la configuración de la API en `src/App.tsx`, conectándolo con las validaciones de rango existentes.
- [ ] 4.2 Verificar el flujo completo (configuración de clave -> foto -> compresión -> extracción -> edición/confirmación -> guardado en histórico) y comprobar que pasa todos los escenarios de especificación.
