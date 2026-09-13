## Context

La aplicación comprueba `navigator.storage.persisted()` al arrancar. Cuando el resultado es `false`, muestra un aviso con un botón que llama a `navigator.storage.persist()`. Actualmente el resultado solo actualiza `isPersistent`, sin informar explícitamente al usuario si la solicitud fue aceptada, rechazada, no soportada o falló.

## Goals / Non-Goals

**Goals:**

- Hacer visible el resultado de la acción "Activar".
- Evitar que una solicitud en curso parezca ignorada.
- Diferenciar éxito, rechazo, falta de soporte y error.
- Mantener la posibilidad de reintentar cuando no se concede la persistencia.
- Exponer el mensaje de resultado a tecnologías de asistencia mediante `role="status"` o un mecanismo equivalente.

**Non-Goals:**

- Cambiar Dexie, IndexedDB o el esquema de lecturas.
- Garantizar persistencia cuando el navegador no la concede.
- Añadir sincronización en la nube o copias de seguridad automáticas.
- Modificar el funcionamiento offline de la PWA.

## Decisions

### 1. Estados separados para la solicitud

Añadir un estado de carga, por ejemplo `isRequestingPersistence`, y un mensaje específico de persistencia. El estado de persistencia (`true`, `false` o `null`) seguirá representando el resultado conocido de `persisted()` o `persist()`.

### 2. Handler único para la acción

Sustituir la llamada inline del botón por un handler asíncrono que:

1. Active el estado de carga.
2. Compruebe si existe `navigator.storage.persist`.
3. Solicite la persistencia.
4. Actualice `isPersistent` con el booleano devuelto.
5. Muestre un mensaje adecuado.
6. Capture excepciones y restablezca el estado de carga en `finally`.

### 3. Feedback visible y accesible

Mientras se procesa la solicitud, el botón debe quedar deshabilitado y cambiar su texto a un estado de espera. El resultado debe mostrarse cerca del aviso mediante un mensaje con `role="status"`, sin depender únicamente de que el aviso desaparezca.

- Éxito: confirmar que el almacenamiento persistente está activado.
- Rechazo: explicar que los datos siguen siendo locales, pero podrían eliminarse si el navegador libera espacio.
- Falta de soporte: indicar que ese navegador no permite solicitar persistencia.
- Error: indicar que la solicitud no pudo completarse y permitir reintentar.

### 4. Duración del mensaje

El mensaje de resultado puede desaparecer automáticamente después de unos segundos, pero el estado persistente debe seguir reflejándose en la interfaz. Los mensajes de rechazo, falta de soporte o error deben permanecer el tiempo suficiente para leerse y no ocultar el aviso de reintento.

## Risks / Trade-offs

- Algunos navegadores pueden devolver `false` sin explicar el motivo; la interfaz debe describir el efecto práctico, no inventar una causa.
- Un mensaje temporal puede desaparecer antes de que algunos usuarios lo lean; por eso el aviso y el estado del botón siguen siendo la fuente principal del estado actual.
- La API puede no estar disponible en contextos inseguros o navegadores antiguos; el chequeo debe evitar errores de JavaScript.
