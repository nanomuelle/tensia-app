## MODIFIED Requirements

### Requirement: Exportación a PDF

El sistema SHALL ofrecer un informe PDF general de las lecturas para un intervalo de fechas inclusivo. El intervalo se interpretará en la zona horaria local e incluirá todas las franjas.

#### Scenario: Abrir el formulario de exportación

- **WHEN** el usuario pulsa **PDF** en los accesos directos o **Exportar PDF** en **Más opciones**
- **THEN** el sistema abre el mismo formulario y rellena **Desde** y **Hasta** con la primera y la última fecha local con lecturas.

#### Scenario: Exportar PDF

- **WHEN** el usuario completa la cabecera, selecciona un intervalo con lecturas y pulsa **Generar y descargar PDF**
- **THEN** se inicia la descarga de `Tensia-Informe_YYYY-MM-DD_YYYY-MM-DD.pdf` con las fechas seleccionadas y se cierra el formulario.
- **AND** el PDF A4 muestra el intervalo, el total de lecturas y la cabecera del paciente con el tipo de medida **Domiciliaria**.
- **AND** la tabla presenta una fila cronológica por lectura, agrupada por fecha local, con hora, franja, sistólica, diastólica y pulso.
- **AND** cada página muestra un pie numerado con el nombre de la app y la fecha de generación.

#### Scenario: Continuación de la tabla

- **WHEN** la tabla ocupa varias páginas
- **THEN** cada página de la tabla repite sus encabezados y muestra la fecha del bloque que continúa.

#### Scenario: Validación o descarga fallida

- **WHEN** falta un dato obligatorio, el intervalo es inválido, no contiene lecturas o se produce un error al generar o iniciar la descarga
- **THEN** se muestra el aviso correspondiente y el formulario permanece abierto.

## ADDED Requirements

### Requirement: Perfil del paciente compartido entre PDF y AMPA

El sistema SHALL compartir el nombre, la fecha de nacimiento, la medicación, el tensiómetro y el brazo usado entre el formulario del PDF general y el del registro AMPA.

#### Scenario: Editar datos del paciente

- **WHEN** el usuario modifica un campo del paciente en cualquiera de los formularios
- **THEN** el campo se guarda localmente al editar, aunque no se genere un informe.
- **AND** el cambio conserva los demás datos del perfil y la preferencia de franjas de AMPA.

#### Scenario: Volver a abrir un formulario

- **WHEN** el usuario abre cualquiera de los dos formularios después de guardar datos del paciente
- **THEN** los campos se rellenan con los valores guardados, incluso después de recargar la aplicación.
