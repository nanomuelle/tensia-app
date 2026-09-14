## MODIFIED Requirements

### Requirement: Copia de seguridad (exportación)
El sistema SHALL permitir exportar toda la base de datos a un fichero JSON descargable, y permitir importar ficheros de copia de seguridad JSON fusionándolos con las lecturas existentes mediante validación y deduplicación basada en valores.

#### Scenario: Exportar backup
- **WHEN** el usuario selecciona "Crear copia de seguridad"
- **THEN** se descarga un `.json` con todas las lecturas.

#### Scenario: Successful export and import merge
- **WHEN** el usuario selecciona "Crear copia de seguridad" o importa un fichero JSON válido con confirmación
- **THEN** se descarga el JSON o se fusionan las lecturas importadas respetando la deduplicación y las validaciones de rango.


