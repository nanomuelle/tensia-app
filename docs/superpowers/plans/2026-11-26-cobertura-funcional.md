# Plan de implementación: cobertura funcional de Tensia

> **Para la ejecución:** usar `superpowers:subagent-driven-development` si hay subagentes disponibles o `superpowers:executing-plans` para ejecución en la sesión. Las casillas son tareas pendientes. Este documento no cambia la aplicación ni da por aprobados los cambios de comportamiento.

**Objetivo:** proteger cada flujo implementado y sus errores relevantes con pruebas repetibles, sin enviar fotos, claves ni datos reales. Cobertura funcional no significa 100 % de líneas.

**Arquitectura:** Node para reglas de dominio y contratos de red; Playwright con Vite dev para interfaz, IndexedDB y descargas reales; Playwright con preview de producción para el service worker y el modo sin conexión. Probar las APIs del navegador con sustitutos deterministas donde delegan al sistema operativo.

**Herramientas:** Node 24, TypeScript, `node:test`, Playwright/Chromium, Vite, Dexie. No añadir otro runner.

**Especificación vigente:** [índice de funcionalidades](../../README.md) y sus fichas; contrastadas con `src/App.tsx`, `src/components/`, `src/hooks/` y `src/services/`. Las fichas siguen siendo la referencia; actualizar sus enlaces a las pruebas al incorporarlas.

## Restricciones y línea base

- Contexto de navegador nuevo por caso, zona `Europe/Madrid`, locale explícito donde se compara texto de fecha; reloj fijo donde importe la fecha actual. Usar esperas de eventos/aserciones, no pausas fijas. Aislar los mocks de `fetch` y restaurarlos incluso si falla el caso: el runner actual usa `--test-isolation=none`.
- Datos sintéticos. Interceptar Gemini antes de navegar y no usar cámara, selector de compartir ni cliente de correo reales en automático. Usar la UI para las acciones bajo prueba; sembrar IndexedDB solo para precondiciones o inyección de fallos.
- Una prueba de caracterización puede pasar al escribirla porque la función ya existe. Para una regresión confirmada, reproducir primero, comprobar que falla por el motivo correcto y separar el arreglo de la ampliación de cobertura. No fijar un comportamiento dudoso como regla por accidente.
- Línea base del 26-11-2026: `npm test` 11/11; `npm run test:e2e` 4/4; `npm run build` correcto, con aviso de tamaño de bundle. No hay suite E2E de producción.

## Cobertura observada

| Funcionalidad | Ya cubierta | Tarea |
| --- | --- | --- |
| Mediciones e historial | AMPA consume lecturas sembradas; no se prueba el alta, edición ni borrado por UI | 1 |
| Copias JSON | El menú abre el selector y un archivo válido abre el resumen; no cubre fusión ni descarga JSON | 2 |
| Foto y clave Gemini | Sin pruebas automatizadas | 3 |
| Compartir | Se comprueba la presencia del acceso, no qué se comparte ni cómo | 4 |
| Datos locales | Restauración del perfil ya probada; faltan upgrade, banner y fallos relevantes | 1, 2, 5, 6 |
| PWA | El build emite manifiesto y SW; no hay prueba sin conexión con build servido | 6 |
| PDF general y AMPA | Sesiones, medias, umbrales, cambio de hora, fechas, paginación, perfil compartido, validación y descargas | 7, sin duplicar la cobertura existente |

## Casos de especial atención

1. Copia con el mismo instante escrito con otro offset y nota en blanco: no añade duplicado (2).
2. Escritura de importación interrumpida tras la primera inserción: ninguna fila nueva debe sobrevivir (2).
3. Gemini devuelve un resultado, pero el usuario cancela: no se guarda ni la lectura ni la foto (3).
4. Un rechazo de Web Share no debe enviar los datos por correo (4).
5. Permiso persistente denegado y red desconectada son situaciones distintas; ninguna ha de impedir el registro local si la app ya está disponible (5 y 6).

## 1. Mediciones e historial — prioridad alta

**Archivos:** `tests/readings-rules.test.ts`, `tests/e2e/readings.spec.ts`; si es necesario para Node, modificar solo el import de `src/services/readingsService.ts` a `./db.ts` y distinguir los tipos con `import type`, o mover reglas puras a un módulo sin Dexie si la carga de la base impide probarlas. No cambiar las reglas. En `src/components/ReadingModal.tsx` y `src/components/ReadingsHistory.tsx`, asociar etiquetas a campos y nombrar los botones de icono si hace falta para selectores accesibles.

- [x] Probar `validateReading`, `getPeriod` y `getCategory`. Validación: `[40,20,10]` y `[250,160,250]` pasan; un valor por debajo/encima de cada rango o `NaN` falla con mensaje del campo. Para `getPeriod`, construir `Date` con hora local: 05:59 Noche, 06:00 y 11:59 Mañana, 12:00 y 19:59 Tarde, 20:00 Noche. Categorías: `[119,79]` Óptima, `[129,84]` Normal, `[139,89]` Normal-Alta, `[159,99]` Grado 1, `[179,109]` Grado 2 y `[180,110]` Grado 3. Incluir `[180,89]` → Normal-Alta según la regla `o` documentada; no reinterpretar los umbrales.
- [x] En E2E, desde vacío abrir **Registrar Toma**, comprobar 120/80/70 y fecha local con reloj fijo. Probar cancelar y rechazar 251 sin escritura (el navegador puede bloquear el submit antes del mensaje de React). Crear con nota `  Control sintético  ` a las 11:59, recargar, abrir **Editar** y comprobar la nota recortada. Editar a las 12:00 y comprobar cambio de grupo, mismo ID y sin fila adicional tras recargar. Cancelar una confirmación de borrado; aceptar otra y verificar vacío tras recargar.
- [x] Probar orden y grupos con lecturas en dos días locales y una hora ISO que cambie de fecha al convertirla a Madrid. Comprobar columnas separadas en escritorio y lista cronológica sin filas visibles duplicadas en móvil (p. ej., 1280×800 y 390×844). Probar la apertura del formulario también desde **Nueva Toma**.
- [x] Verificar con `npm test` y `npm run test:e2e -- tests/e2e/readings.spec.ts`; actualizar [Mediciones e historial](../../funcionalidades/mediciones.md).

## 2. Copias JSON y seguridad de datos — prioridad alta

**Archivos:** `tests/e2e/backup.spec.ts`, `tests/e2e/readings-db.spec.ts`, `tests/e2e/helpers/indexedDb.ts`, `tests/e2e/ampa.spec.ts`. El helper expone `seedReadings(page: Page, items: readonly BloodPressureRecord[]): Promise<void>` y `readStoredReadings(page: Page): Promise<BloodPressureRecord[]>`; usa la instancia Dexie de la página de desarrollo tras cargar la app, espera las operaciones y no recarga implícitamente; el cierre de la conexión queda ligado al contexto del navegador. Reutilizarlo en lugar del seed local de AMPA. Las pruebas de servicio que requieran IDB pueden importar `/src/services/readingsService.ts` dentro de `page.evaluate` en el proyecto de desarrollo para usar Dexie sobre IDB real.

- [x] Probar un archivo de cuatro filas: una ya guardada (instante `2026-11-23T11:00:00Z` repetido como `2026-11-23T12:00:00+01:00`, nota ausente frente a espacios), una nueva válida repetida dos veces y una fecha inválida. Esperar total 4, nuevas 1, duplicados 2 e inválidas 1. Cancelar deja una toma; repetir el archivo y confirmar deja dos tras recarga. La nueva no reutiliza el ID del archivo y recalcula la franja; la original no cambia. Repetir la importación: confirmar deshabilitado. Incluir una variante que difiera solo en nota y se trate como nueva.
- [x] Probar JSON truncado, raíz `{}`, array vacío y fallo simulado de `FileReader.readAsText`; comprobar aviso o resumen sin candidatas, ninguna escritura y capacidad de volver a seleccionar. Mover a este archivo la parte de la prueba existente que abre el selector desde el menú; conservar en `ampa.spec.ts` la aserción de orden de accesos.
- [x] Probar `persistImportedRecords`: inyectar un rechazo al segundo `add` tras confirmar el primero dentro de la transacción de Dexie, restaurar la intervención en `finally` y comprobar que los datos iniciales quedan intactos. La prueba afirma la reversión en IndexedDB. Queda aparte comprobar el aviso visible tras el fallo: `App.tsx` entrega el error al formulario de mediciones, que no está abierto durante la importación.
- [x] Descargar **Backup**, comprobar `Tensia-Backup.json`, analizar su contenido y verificar campos, valores y exclusión de clave, perfil y consentimiento aun cuando existan en el navegador. Importar el archivo descargado en un contexto vacío y verificar equivalencia de las tomas tras recarga, sin exigir mismos IDs.
- [x] Verificar con `npm run test:e2e -- tests/e2e/backup.spec.ts tests/e2e/readings-db.spec.ts tests/e2e/ampa.spec.ts`; actualizar [Copias JSON](../../funcionalidades/copias-json.md). `importDatabaseFromJson` no tiene consumidores activos: es destructivo, no se debe probar como si fuera el flujo de usuario ni reconectarlo. Confirmar su retirada o cobertura de compatibilidad solo si se identifica un consumidor.

## 3. Gemini y foto — prioridad alta

**Archivos:** `tests/gemini.test.ts`, `tests/e2e/photo.spec.ts`. Ajustes opcionales de nombre/etiqueta en `src/components/ApiKeyModal.tsx` para localizar el campo y el control de mostrar/ocultar sin CSS.

- [x] Probar `testGeminiApiKey` y `analyzeBloodPressureImage` con `fetch` simulado. Afirmar clave recortada y codificada (p. ej., `  clave+prueba  `), método POST, prueba de clave sin `inline_data`, JPEG y tres campos requeridos en análisis, y resultado `{ systolic: 132, diastolic: 81, pulse: 64 }`. Clave vacía: error antes de `fetch`. Cubrir HTTP con mensaje JSON y con cuerpo no JSON, fallo de red, candidato vacío, texto no JSON y un campo no numérico. No confundir la validación del JSON con los límites al guardar.
- [x] Probar clave inexistente → configuración; mostrar/ocultar, probar sin persistir, error y éxito simulados, guardar y recuperar tras reload; cancelar borrado conserva la clave, aceptar la elimina. Asegurar que un clic sin clave no envía un análisis.
- [x] Con clave sintética: cancelar consentimiento no abre selector ni hace POST; aceptar abre foto y recordar consentimiento tras recarga. Accionar ambos botones y comprobar qué input llega al selector (cámara usa `capture="environment"`). Alimentar imagen generada de 1600×800 o 800×1600; verificar JPEG y salida 1024×512 o 512×1024 en el request usando un decodificador del navegador. Para una imagen que no se puede abrir, comprobar error visible y cero solicitudes de análisis.
- [x] Simular una respuesta válida y otra fallida. El éxito precarga `132/81/64`, hora fija y nota de captura; cerrar no añade nada, y guardar sí crea exactamente una toma. Verificar que IDB no contiene imagen ni base64. En el fallo, poder volver a capturar o introducir una toma manual. Probar resultado numérico fuera de rango sin permitir guardarlo.
- [x] Verificar con `npm test` y `npm run test:e2e -- tests/e2e/photo.spec.ts`; actualizar [Reconocimiento por foto](../../funcionalidades/reconocimiento-foto.md). Cámara y galería nativas: comprobación manual en móvil, sin llamada externa real necesaria para la suite.

## 4. Compartir y navegación — prioridad media

**Archivos:** `tests/e2e/share.spec.ts` conserva la comprobación de menú sin duplicar AMPA; para observar `mailto:` sin abrir el cliente de correo, se extrae a `src/services/shareService.ts` la función `shareReadings(readings: readonly BloodPressureRecord[], share: ((data: ShareData) => Promise<void>) | undefined, openMail: (url: string) => void): Promise<void>` y se prueba en `tests/share.test.ts`. En `src/App.tsx` pasar `navigator.share?.bind(navigator)` y una función que asigne `window.location.href`. No lanzar un correo en pruebas.

- [x] Probar compartir deshabilitado sin tomas en ambos accesos. Con seis tomas, capturar la llamada a `navigator.share`: título `Tensia`, cabecera `Tensión Arterial (Tensia):`, cinco líneas en orden descendente con fecha local, franja y `mmHg`; no incluir pulso, nota, perfil ni archivos. Probar acceso directo y menú.
- [x] Con `navigator.share` rechazando con `AbortError`, comprobar que no se abre correo. Con Web Share ausente, interceptar la salida y afirmar una URL `mailto:` con asunto `Tensión` y cuerpo decodificado idéntico al resumen. No usar interceptación de red de Playwright para un esquema que no es HTTP: usar el límite anterior si el navegador no permite observar la salida de forma estable.
- [x] Conservar la aserción del orden de accesos directos; cubrir la entrada AMPA desde el menú, el cierre del menú al pulsar fuera y la disponibilidad de los accesos en vacío sin repetir toda la generación de PDF.
- [x] Verificar con `npm test` y `npm run test:e2e -- tests/e2e/share.spec.ts tests/e2e/ampa.spec.ts`; actualizar [Compartir lecturas](../../funcionalidades/compartir-lecturas.md).

## 5. Persistencia y migración — prioridad alta

**Archivos:** `tests/e2e/storage.spec.ts`, `tests/e2e/readings-db.spec.ts`.

- [ ] Simular `navigator.storage.persisted()` y `persist()` antes de navegar. Estado ya concedido: no mostrar banner ni solicitar permiso. Estado no concedido: probar solicitud pendiente (control deshabilitado), concesión, negativa, excepción y `persist` ausente. En negativa, afirmar aviso, crear una toma y verificarla tras recargar. Cerrar el aviso y recargar mantiene el descarte. Si también falta `persisted()`, no hay botón en la implementación actual: comprobar que no hay bloqueo de la app, no exigir que se muestre un mensaje inaccesible.
- [ ] Crear un contexto nuevo con una base v1 que contenga una toma usando el esquema anterior de Dexie; abrir la app v2 y comprobar que la toma persiste con el mismo ID y se puede guardar un ajuste sin perderla. Evitar hardcodear la versión nativa de IndexedDB a partir del número de versión de Dexie; usar Dexie para preparar el esquema anterior.
- [ ] Verificar con `npm run test:e2e -- tests/e2e/storage.spec.ts tests/e2e/readings-db.spec.ts`; actualizar [Datos locales y PWA](../../arquitectura/datos-locales-y-pwa.md).

## 6. PWA de producción — prioridad alta

**Archivos:** `playwright.pwa.config.ts`, `tests/pwa/offline.spec.ts`, `package.json`; `vite.config.ts` y `public/` solo si se aprueba corregir recursos ausentes. Usar `npm run test:pwa` para compilar y ejecutar `playwright test --config=playwright.pwa.config.ts`; preview en `127.0.0.1:4175` con `--strictPort`, service workers permitidos y contextos aislados. Mantener dev y PWA como suites distintas.

- [ ] Comprobar manifiesto (`display: standalone`, nombre, iconos declarados) y que los iconos responden con imágenes, no con el HTML del fallback. Hallazgo de auditoría: `vite.config.ts` declara PNG de 192 y 512 px, pero no están versionados y no aparecen en `dist/` tras compilar. Tratar el fallo como diagnóstico de empaquetado a confirmar, no debilitar el test ni suponer que un build correcto equivale a una instalación válida.
- [ ] Abrir en línea, esperar `navigator.serviceWorker.ready` y `navigator.serviceWorker.controller`; cambiar el contexto a offline y recargar. Afirmar historial inicial, registrar una toma, volver a recargar y comprobar que la toma sigue. Descargar un backup JSON, restaurar un archivo local y descargar un PDF local con perfil sintético; afirmar tipo o contenido de cada descarga, no solo que hay un botón.
- [ ] Documentar en la ficha PWA la distinción entre recarga offline tras cacheado y primera visita sin red. Mantener instalación real desde el navegador y controles del dispositivo como smoke manual; la prueba de Chromium no garantiza instalación en cualquier navegador.
- [ ] Verificar con `npm run test:pwa` y documentar el comando en [Entorno y pruebas](../../desarrollo/entorno-y-pruebas.md).

## 7. Completar informes sin duplicar casos — prioridad media

**Archivos:** `tests/e2e/ampa.spec.ts`; si se prueba error de carga/guardado por separado, `tests/e2e/reports-errors.spec.ts`.

- [ ] En PDF general, con perfil completo, probar intervalo válido que no contiene tomas (entre las dos fechas sembradas): aviso `No hay lecturas en el intervalo seleccionado.`, modal abierto y ninguna descarga. Sin historial, el acceso PDF está deshabilitado; AMPA se puede abrir y la generación queda deshabilitada (conservar el caso existente).
- [ ] Comprobar que cambiar el intervalo no lo guarda y que reabrir propone el completo; elegir manualmente otra semana AMPA y verificar que al reabrir vuelve al valor predeterminado mientras conserva la preferencia de franjas. No repetir pruebas de paginación ni de sesiones.
- [ ] Probar error al leer el perfil (por ejemplo, JSON inválido en `ampa_report_profile`) y un fallo controlado al escribir el perfil en IDB: se ven los avisos correspondientes y se puede cerrar el informe. Comprobar que un guardado parcial exitoso no borra los campos no editados; las lecturas no se modifican en ningún escenario de informes.
- [ ] Verificar con `npm test` y `npm run test:e2e -- tests/e2e/ampa.spec.ts` (incluir `reports-errors.spec.ts` si se crea); actualizar [Informes PDF y AMPA](../../funcionalidades/informes-pdf-y-ampa.md).

## Cierre

- [ ] Ejecutar desde una instalación limpia: `npm ci`, `npx playwright install chromium`, `npm test`, `npm run test:e2e`, `npm run build`, `npm run test:pwa`. En cada fase, revisar el diff y agrupar los cambios en commits pequeños por funcionalidad. Si se añade CI, ejecutar esos mismos comandos en Node 24, sin secretos y conservando el reporte de Playwright en fallos.
- [ ] Enlazar las suites por funcionalidad desde las fichas y listar en la guía los comandos y los límites manuales: integración con cámara/galería y destinos nativos de compartir, instalación en dispositivo y ningún test dependiente de Gemini real.
- [ ] Dar por completada la cobertura cuando cada fila de la matriz tenga pruebas ejecutadas o un límite manual explícito, no por alcanzar un porcentaje arbitrario. Si alguna prueba revela divergencias respecto a las fichas, registrar reproducción y comportamiento esperado antes de decidir el arreglo.
