# blood-pressure-tracker Specification

## Purpose
Registro, consulta, edición, exportación y respaldo de mediciones de tensión arterial: simple, offline, adaptado a adultos mayores.

## Requirements

### Requirement: Registro rápido de lecturas
El sistema SHALL permitir registrar sistólica, diastólica y pulso, con fecha/hora actual editable.

#### Scenario: Registro válido
- **WHEN** el usuario introduce valores dentro de rango (ver design.md § Decisions) y guarda
- **THEN** la medición se almacena en IndexedDB y aparece en el histórico.

#### Scenario: Valores fuera de rango
- **WHEN** el usuario introduce valores fuera de los rangos definidos en design.md, o sistólica ≤ diastólica
- **THEN** se muestra un aviso claro sin perder los datos introducidos.

### Requirement: Interfaz accesible
El sistema SHALL usar botones ≥48px, alto contraste (WCAG AAA) y tipografía grande en toda la app.

#### Scenario: Pantalla principal
- **WHEN** el usuario abre la app
- **THEN** campos y botones cumplen el tamaño táctil y contraste mínimos.

### Requirement: Histórico agrupado por día y franja horaria
El sistema SHALL agrupar las lecturas por día y franja (Mañana 06:00–11:59, Tarde 12:00–19:59, Noche 20:00–05:59).

#### Scenario: Consulta del histórico
- **WHEN** el usuario abre el historial
- **THEN** ve las lecturas en orden cronológico inverso, agrupadas por día y franja.

### Requirement: Exportación a PDF
El sistema SHALL generar un PDF con el listado de lecturas para el médico.

#### Scenario: Exportar PDF
- **WHEN** el usuario pulsa "Exportar PDF para el médico"
- **THEN** se descarga un PDF con la tabla de lecturas y resumen del periodo.

### Requirement: Compartir informe
El sistema SHALL permitir compartir el informe vía Web Share API, con fallback a `mailto:`.

#### Scenario: Compartir
- **WHEN** el usuario pulsa "Compartir por WhatsApp/Email"
- **THEN** se abre el selector nativo si hay soporte, o un enlace `mailto:` si no.

### Requirement: Copia de seguridad (exportación)
El sistema SHALL permitir exportar toda la base de datos a un fichero JSON descargable.

#### Scenario: Exportar backup
- **WHEN** el usuario selecciona "Crear copia de seguridad"
- **THEN** se descarga un `.json` con todas las lecturas.

### Requirement: Persistencia reforzada y PWA offline
El sistema SHALL solicitar almacenamiento persistente y funcionar offline como PWA instalable.

#### Scenario: Uso offline
- **WHEN** el usuario abre la PWA instalada sin conexión
- **THEN** carga vía Service Worker y permite registrar/consultar datos.

### Requirement: Edición y borrado de lecturas
El sistema SHALL permitir editar o eliminar una lectura guardada desde el histórico.

#### Scenario: Editar
- **WHEN** el usuario modifica una lectura existente
- **THEN** se guarda aplicando las mismas validaciones que en el alta.

#### Scenario: Eliminar
- **WHEN** el usuario elige eliminar una lectura y confirma
- **THEN** se borra permanentemente de la base de datos local.

### Requirement: Notas opcionales
El sistema SHALL permitir un campo de texto libre opcional por lectura.

#### Scenario: Con nota
- **WHEN** el usuario
