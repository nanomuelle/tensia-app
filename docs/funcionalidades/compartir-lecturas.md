# Compartir lecturas

## Flujo

**Compartir**, en los accesos directos o en **Más opciones**, prepara un resumen de texto de hasta las cinco tomas más recientes. No adjunta un [PDF](informes-pdf-y-ampa.md) ni una [copia JSON](copias-json.md). La acción está deshabilitada cuando no hay tomas.

## Reglas y datos

Cada línea contiene la fecha local, la franja guardada y la presión sistólica/diastólica en mmHg; no incluye pulso, notas ni perfil del paciente. Si existe `navigator.share`, abre el selector nativo con el texto. Si no existe, abre un enlace `mailto:` con asunto y cuerpo, lo que requiere un cliente de correo. Cancelar o fallar en el selector nativo no activa la alternativa de correo. El usuario elige el destino; el texto contiene datos de salud.

## Código y verificación

- [Servicio de compartir](../../src/services/shareService.ts) y [conexión con el navegador](../../src/App.tsx), [orden de lecturas](../../src/services/readingsService.ts), [accesos directos](../../src/components/QuickActionsBar.tsx) y [menú](../../src/components/UtilitiesMenu.tsx).
- [Pruebas de navegador](../../tests/e2e/share.spec.ts): accesos, orden y contenido del resumen. [Pruebas del servicio](../../tests/share.test.ts): alternativa por correo y ausencia de alternativa si Web Share rechaza.
- **Comprobación manual:** en un dispositivo con Web Share o cliente de correo, abrir el selector con lecturas sintéticas y cancelar antes del envío.
