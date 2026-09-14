## 1. Estado y lógica de persistencia

- [x] 1.1 Añadir estado para indicar que la solicitud de persistencia está en curso.
- [x] 1.2 Añadir estado para el mensaje de resultado de persistencia.
- [x] 1.3 Crear un handler asíncrono para comprobar soporte, solicitar persistencia y manejar éxito, rechazo y excepciones.
- [x] 1.4 Garantizar que el estado de carga se restablece aunque la API lance un error.

## 2. Feedback de interfaz

- [x] 2.1 Deshabilitar el botón mientras la solicitud está en curso.
- [x] 2.2 Mostrar un texto de espera durante la solicitud.
- [x] 2.3 Mostrar un mensaje claro cuando la persistencia se activa.
- [x] 2.4 Mostrar un mensaje claro cuando el navegador rechaza la solicitud.
- [x] 2.5 Mostrar un mensaje claro si la API no existe o se produce un error.
- [x] 2.6 Añadir feedback accesible con `role="status"` o equivalente.
- [x] 2.7 Mantener visible la opción de reintento cuando la persistencia no se concede.

## 3. Validación

- [x] 3.1 Verificar el caso de éxito con `navigator.storage.persist()` devolviendo `true`.
- [x] 3.2 Verificar el caso rechazado con `navigator.storage.persist()` devolviendo `false`.
- [x] 3.3 Verificar un navegador sin `navigator.storage.persist()`.
- [x] 3.4 Verificar una excepción de la API.
- [x] 3.5 Ejecutar `npm run build` sin errores.
