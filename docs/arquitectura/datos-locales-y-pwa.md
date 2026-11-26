# Datos locales, privacidad y PWA

## Dónde se guarda cada dato

| Ubicación | Contenido |
| --- | --- |
| IndexedDB, base `TensiaDatabase`, tabla `readings` | Mediciones con ID autoincremental, sistólica, diastólica, pulso, instante ISO, franja y nota opcional. |
| IndexedDB, tabla `settings` (desde la versión 2 del esquema) | Clave de Gemini (`gemini_api_key`) y perfil compartido de informes con preferencia de franjas AMPA (`ampa_report_profile`). |
| `localStorage` | Aceptación del aviso de foto (`tensia_privacy_accepted`) y descarte del banner (`tensia_dismiss_persistence_banner`). |

Los datos se aíslan por origen y perfil del navegador. Abrir la app desde otro puerto, dominio o navegador no recupera automáticamente las tomas. Los [backups JSON](../funcionalidades/copias-json.md) trasladan lecturas, no ajustes.

## Persistencia y modo sin conexión

El banner situado encima de los accesos directos consulta `navigator.storage.persisted()` cuando está disponible. Al solicitar persistencia, usa `navigator.storage.persist()` y da un mensaje distinto si el permiso se concede, se deniega, no se admite o falla. La denegación no impide guardar en IndexedDB, pero el navegador podría liberar ese almacenamiento. Cerrar el aviso solo guarda su descarte; ni el permiso ni instalar la PWA sustituyen un backup.

El build de producción configura el manifiesto y un service worker con actualización automática. Una vez que la aplicación se ha cargado y sus recursos están en caché, el registro manual, el historial, las copias JSON y la generación local de PDF no requieren API remota. La disponibilidad de la PWA depende del navegador, del contexto seguro y de que los recursos sigan en caché; la primera visita no puede depender de esa caché. La [foto con Gemini](../funcionalidades/reconocimiento-foto.md) sí requiere red.

## Salidas de datos

No hay sincronización de las lecturas con un servidor en los flujos locales. La foto comprimida se envía a Google al elegir analizarla; las exportaciones crean archivos fuera de la app y **Compartir** entrega el texto al sistema o al cliente de correo. Evita adjuntar lecturas reales o claves en incidencias y capturas.

## Código y verificación

- [Esquema de Dexie](../../src/services/db.ts), [ajustes](../../src/services/settingsService.ts), [persistencia](../../src/hooks/useStoragePersistence.ts), [banner](../../src/components/StorageBanner.tsx) y [configuración PWA](../../vite.config.ts).
- Pruebas de navegador: [restauración de preferencias](../../tests/e2e/ampa.spec.ts), [migración de IndexedDB](../../tests/e2e/readings-db.spec.ts) y [solicitud o descarte del aviso de persistencia](../../tests/e2e/storage.spec.ts).
- [Pruebas PWA](../../tests/pwa/offline.spec.ts): manifiesto y flujos locales sin red una vez activado el service worker en preview. Comprueban recarga, alta, backup, importación y PDF. Las rutas de los PNG de instalación devuelven HTML porque los recursos no se incluyen en el build; la prueba los registra como fallo conocido, no como instalación válida.
- **Comprobación manual:** verificar la instalación en un dispositivo tras corregir los iconos. Una primera visita sin red no tiene la caché necesaria.
