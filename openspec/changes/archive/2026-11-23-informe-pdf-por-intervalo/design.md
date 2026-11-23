## Context

El PDF general exportaba todas las lecturas en un listado. AMPA ya disponía de un formulario, una cabecera maquetada y un perfil persistente.

## Decisions

- Reutilizar el formulario de informes con un modo para el historial y otro para AMPA. El modo de historial calcula las fechas iniciales a partir de las lecturas y aplica el intervalo inclusivo en la zona horaria local.
- Mantener el perfil en la clave `ampa_report_profile` de IndexedDB. Cada edición actualiza solo los campos modificados en una transacción, incluida la preferencia de franjas cuando se edita desde AMPA.
- Compartir la maquetación de la cabecera del paciente entre ambos PDF. El informe general presenta una fila por lectura y repite los encabezados en cada página de la tabla.
- Iniciar la descarga desde la acción de generar y cerrar el formulario después. Los errores de validación o generación se muestran en el formulario abierto.
