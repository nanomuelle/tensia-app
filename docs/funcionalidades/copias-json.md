# Copias de seguridad JSON

## Flujo

- **Backup** descarga `Tensia-Backup.json`, una lista de las tomas guardadas con los campos `id`, `systolic`, `diastolic`, `pulse`, `timestamp`, `period` y, si existe, `notes`. No incluye la clave de Gemini ni el perfil de informes.
- En **Más opciones → Importar JSON**, selecciona un archivo JSON. El resumen indica cuántos registros hay, cuántos son nuevos, cuántos son duplicados y cuántos son inválidos. Nada se escribe antes de confirmar. Si no hay lecturas nuevas válidas, no se puede confirmar.

## Reglas y datos

La raíz debe ser una lista. Para cada fila, el importador lee las tres cifras con `parseInt` y verifica los [rangos de mediciones](mediciones.md) y que la fecha sea interpretable. Convierte la fecha a ISO y recorta las notas de texto. Compara sistólica, diastólica, pulso, instante normalizado y nota (ausente y vacía se tratan igual) tanto con la base local como con las filas válidas anteriores del archivo.

Al confirmar, añade solo las tomas nuevas válidas en una transacción; no borra ni sobrescribe las anteriores. No reutiliza el identificador ni la franja del archivo: asigna un ID nuevo y recalcula la franja según la hora local. Un archivo ilegible, un JSON mal formado o una raíz que no es una lista genera un aviso. El análisis y la escritura son locales; la copia descargada contiene datos de salud en texto legible.

## Código y verificación

- [Menú](../../src/components/UtilitiesMenu.tsx), [resumen](../../src/components/ImportSummaryModal.tsx), [flujo de archivo](../../src/hooks/useBackupImport.ts) y [análisis y persistencia](../../src/services/readingsService.ts). El flujo visible usa `analyzeJsonImport` y `persistImportedRecords`, no `importDatabaseFromJson`.
- [Pruebas de navegador](../../tests/e2e/backup.spec.ts): selector, resumen, cancelación, deduplicación, entradas inválidas y restauración de una descarga en otro contexto. [Prueba de IndexedDB](../../tests/e2e/readings-db.spec.ts): un fallo en la segunda escritura revierte la importación completa.
- **Comprobación manual:** con una toma sintética ya guardada, importar un archivo con esa toma, otra nueva repetida dos veces y una fila inválida: cuatro registros, una candidata nueva, dos duplicados y una inválida. Confirmar, recargar y comprobar que se conservan ambas tomas. Reimportar el mismo archivo no debe añadir otra.
