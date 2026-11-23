## Why

El informe general necesita un intervalo configurable y una cabecera que identifique al paciente. Reutilizar el perfil AMPA evita volver a introducir los mismos datos.

## What Changes

- Abrir un formulario de exportación con fechas Desde y Hasta.
- Generar un PDF A4 con cabecera del paciente, lecturas agrupadas por fecha y páginas numeradas.
- Compartir los datos del paciente entre el PDF general y el registro AMPA.

## Capabilities

### Modified Capabilities

- `blood-pressure-tracker` incorpora la exportación por intervalo y el perfil compartido.

## Impact

El cambio afecta a los dos accesos al PDF general, al formulario de informes y a la maquetación PDF. Reutiliza la tabla de ajustes de IndexedDB.
