# Persistence Feedback Specification

## Purpose

Comunicar de forma clara el resultado de la solicitud de almacenamiento persistente para que el usuario sepa si la acción fue aceptada, rechazada, no soportada o falló.

## Requirements

### Requirement: Feedback durante la solicitud de persistencia

El sistema SHALL indicar que la solicitud de almacenamiento persistente está en curso y SHALL impedir solicitudes duplicadas mientras espera la respuesta del navegador.

#### Scenario: Solicitud en curso

- **WHEN** el usuario pulsa "Activar"
- **THEN** el botón se deshabilita temporalmente y muestra un estado de espera.

### Requirement: Confirmación de persistencia activada

El sistema SHALL confirmar explícitamente cuando `navigator.storage.persist()` devuelve `true`.

#### Scenario: Persistencia concedida

- **WHEN** el navegador concede el almacenamiento persistente
- **THEN** se muestra un mensaje indicando que el almacenamiento persistente está activado
- **AND** el aviso de activación deja de mostrar el botón de solicitud.

### Requirement: Explicación del rechazo

El sistema SHALL explicar el resultado cuando el navegador devuelve `false`.

#### Scenario: Persistencia rechazada

- **WHEN** el navegador no concede el almacenamiento persistente
- **THEN** se muestra un mensaje indicando que la solicitud fue rechazada
- **AND** se explica que las lecturas siguen guardándose localmente, pero podrían eliminarse si el navegador libera espacio
- **AND** el usuario puede volver a intentarlo.

### Requirement: Navegador sin soporte

El sistema SHALL informar cuando `navigator.storage.persist()` no está disponible.

#### Scenario: API no disponible

- **WHEN** el navegador no expone la API de persistencia
- **THEN** se muestra un mensaje indicando que esa función no es compatible con el navegador actual
- **AND** no se produce un error visible de JavaScript.

### Requirement: Error durante la solicitud

El sistema SHALL informar cuando la solicitud lanza una excepción inesperada.

#### Scenario: Error de la API

- **WHEN** `navigator.storage.persist()` lanza un error
- **THEN** se muestra un mensaje indicando que no se pudo completar la solicitud
- **AND** se restablece el botón para permitir un nuevo intento.

### Requirement: Feedback accesible del resultado

El sistema SHALL exponer el resultado de la solicitud mediante un elemento de estado accesible para lectores de pantalla.

#### Scenario: Lectura del resultado

- **WHEN** aparece un mensaje de éxito, rechazo, falta de soporte o error
- **THEN** el mensaje se anuncia mediante `role="status"` o un mecanismo de accesibilidad equivalente.
