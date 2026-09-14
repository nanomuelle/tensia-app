## Why

Cuando el usuario pulsa "Activar" para solicitar almacenamiento persistente y el navegador rechaza la solicitud, el aviso actual permanece sin cambios. No existe una explicación visible del resultado, por lo que la acción parece no haber funcionado y genera frustracion.

## What Changes

- Añadir feedback explícito al solicitar almacenamiento persistente.
- Mostrar un estado de carga mientras el navegador responde.
- Confirmar visualmente cuando la persistencia se activa.
- Explicar cuando el navegador rechaza la solicitud.
- Informar cuando la API no está disponible o se produce un error.
- Mantener el aviso y permitir reintentar cuando la persistencia no se concede.

## Capabilities

### Modified Capabilities

- `blood-pressure-tracker`: mejorar la comunicación del estado de almacenamiento persistente.

## Impact

- **Código**: estado y handler de persistencia en `src/App.tsx`.
- **Interfaz**: aviso de almacenamiento persistente y mensaje de resultado.
- **Datos**: no cambia el esquema de IndexedDB ni la forma de guardar lecturas.
- **Compatibilidad**: se contemplan navegadores sin `navigator.storage.persist()`.
