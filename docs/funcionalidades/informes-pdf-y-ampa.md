# Informes PDF y AMPA

## Flujo

Desde los accesos directos o **Más opciones**, abre **PDF** o **Exportar PDF** para un intervalo de lecturas, y **Registro AMPA** o **Informe semanal AMPA** para un resumen semanal. Ambos formularios comparten nombre, fecha de nacimiento, medicación, tensiómetro y brazo. Esos campos son obligatorios para generar el informe; si no hay medicación, la interfaz indica escribir «Sin medicación». Los cambios del perfil se guardan localmente al editar y se recuperan al abrir cualquiera de los dos formularios.

Al pulsar **Generar y descargar PDF**, la app prepara el archivo en el navegador e inicia la descarga. Si el intervalo no es válido, faltan datos o falla la preparación, muestra un mensaje y no cierra el formulario. Sin lecturas disponibles para el modo seleccionado, el botón queda deshabilitado.

## Reglas y datos

### PDF general

- Propone el intervalo desde la primera hasta la última fecha del historial. **Desde** y **Hasta** son inclusivas en la zona horaria del navegador, que también muestra el formulario. No se guarda el intervalo como preferencia.
- El informe incluye la cabecera del paciente y una tabla con fecha, hora, franja, sistólica, diastólica y pulso; la cabecera de la tabla se repite al paginar.

### Informe semanal AMPA

- Usa semanas de lunes a domingo y ofrece las que tienen sesiones para las franjas elegidas. Selecciona la semana actual si tiene datos; si no, la más cercana al día actual (la anterior si hay empate). Se puede elegir **Mañana, tarde y noche** o **Solo mañana y noche**; esa preferencia se guarda, no la semana.
- Agrupa tomas consecutivas de la misma franja si entre ellas pasan como máximo 15 minutos reales. La fecha local de la primera toma determina la semana de la sesión.
- La media de una sesión usa todas sus tomas salvo la primera si hay tres o más. Las medias de resumen promedian sesiones, no tomas individuales. El recuento y porcentaje de tomas altas sí incluyen las primeras tomas omitidas de las medias: sistólica ≥ 135 o diastólica ≥ 85 mmHg; el porcentaje se redondea al entero.
- El informe contiene datos de salud y del perfil. Al descargarlo, el archivo queda fuera del almacenamiento de la app. Los umbrales describen el cálculo, no constituyen consejo médico.

## Código y verificación

- [Formulario común](../../src/components/AmpaReportModal.tsx), [perfil](../../src/services/settingsService.ts), [cabecera PDF](../../src/services/pdfPatientHeader.ts), [PDF general](../../src/services/pdfService.ts), [cálculos AMPA](../../src/services/ampaReport.ts) y [PDF AMPA](../../src/services/ampaPdfService.ts).
- [Pruebas unitarias](../../tests/ampa.test.ts): cálculos, cambio de hora, filtros, fechas y paginación. [Pruebas de navegador](../../tests/e2e/ampa.spec.ts): perfil compartido, restauración, validación y descarga; intervalo sin resultados y selección de semana no persistente. [Fallos de almacenamiento](../../tests/e2e/reports-errors.spec.ts): errores al leer o guardar el perfil sin cambiar las mediciones.
