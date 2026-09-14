## MODIFIED Requirements

### Requirement: Histórico agrupado por día y franja horaria
El sistema SHALL agrupar las lecturas por día. En pantallas de escritorio/tablet, el sistema SHALL presentar cada día en una estructura de dos columnas donde la columna izquierda contiene las lecturas de la franja de Mañana (06:00–11:59) y la columna derecha contiene las lecturas de las franjas de Tarde (12:00–19:59) y Noche (20:00–05:59) agrupadas conjuntamente. En dispositivos móviles, el sistema SHALL colapsar a una sola columna con lecturas apiladas en orden cronológico inverso dentro del día. Cada lectura individual conservará su etiqueta de franja horaria correspondiente.

#### Scenario: Visualización del historial en escritorio y tablet
- **WHEN** el usuario visualiza el historial en pantalla grande (desktop/tablet)
- **THEN** cada día muestra dos columnas: columna izquierda con Mañana y columna derecha con Tarde y Noche combinadas, manteniendo las etiquetas individuales por lectura.

#### Scenario: Visualización del historial en móvil
- **WHEN** el usuario visualiza el historial en pantalla móvil
- **THEN** el historial se presenta en una sola columna con lecturas apiladas en orden cronológico inverso dentro de cada día.

## ADDED Requirements

### Requirement: Reorganización de la interfaz de acciones, configuración y herramientas
El sistema SHALL mostrar en el encabezado las acciones primarias únicas y sin duplicar ("Nueva Toma" y "Foto y listo"). La configuración de la API key de Gemini se ubicará en un icono de engranaje independiente fuera de la barra de acciones primarias. Las herramientas auxiliares (PDF, Compartir, Backup, Importar) se agruparán en un menú desplegable o de "más opciones" único. El banner de almacenamiento persistente se presentará como un aviso discreto y descartable.

#### Scenario: Acceso a acciones primarias y configuración
- **WHEN** el usuario observa el encabezado de la aplicación
- **THEN** visualiza claramente las dos acciones primarias ("Nueva Toma" y "Foto y listo") sin duplicados, junto con un icono de engranaje independiente para la configuración de la clave API de Gemini.

#### Scenario: Uso del menú de herramientas auxiliares
- **WHEN** el usuario pulsa sobre el menú de "más opciones" o herramientas auxiliares
- **THEN** se despliega un menú que agrupa la exportación PDF, compartir, copia de seguridad (backup) e importar JSON.

#### Scenario: Aviso de almacenamiento persistente
- **WHEN** el navegador permite almacenamiento persistente o requiere solicitud
- **THEN** el aviso de almacenamiento se muestra como un banner discreto y descartable (persistente o recordado según decisión de diseño hasta activarse o descartarse).

