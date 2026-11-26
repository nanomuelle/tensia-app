# Entorno y pruebas

Tensia usa React, TypeScript, Vite y Tailwind CSS. La entrada es [`src/main.tsx`](../../src/main.tsx) y la pantalla principal se compone en [`src/App.tsx`](../../src/App.tsx). Usa Node.js 24 para el flujo documentado, en particular para ejecutar las pruebas TypeScript con el runner de Node.

| Comando | Uso |
| --- | --- |
| `npm ci` | Instalar las dependencias del lockfile. |
| `npm run dev` | Iniciar Vite con recarga en desarrollo. |
| `npm run build` | Comprobar TypeScript y generar el build de producción en `dist/`. |
| `npm run preview` | Servir el build localmente después de compilar. Úsalo para comprobar la PWA. |
| `npm test` | Ejecutar pruebas de Node en `tests/*.test.ts`. |
| `npx playwright install chromium` | Instalar el Chromium de Playwright. |
| `npm run test:e2e` | Ejecutar las pruebas de navegador contra Vite en desarrollo. |
| `npm run test:pwa` | Compilar y ejecutar las pruebas PWA contra preview en `127.0.0.1:4175`. |

## Cobertura

- Pruebas de Node: [AMPA y PDF](../../tests/ampa.test.ts) y [reglas de mediciones](../../tests/readings-rules.test.ts), [contrato Gemini](../../tests/gemini.test.ts) y [compartir](../../tests/share.test.ts).
- Pruebas de navegador: [informes y accesos directos](../../tests/e2e/ampa.spec.ts), [mediciones e historial](../../tests/e2e/readings.spec.ts), [descarga y restauración JSON](../../tests/e2e/backup.spec.ts) y [transacción de importación](../../tests/e2e/readings-db.spec.ts). [Playwright](../../playwright.config.ts) arranca Vite en `127.0.0.1:4174`, usa Chromium y emula la zona `Europe/Madrid`. Las pruebas usan contextos aislados y lecturas sintéticas.
- Hay casos adicionales en las fichas de foto, compartir y datos locales del [índice](../README.md). Las pruebas PWA usan una [configuración aparte](../../playwright.pwa.config.ts) y documentan el fallo conocido de iconos.
- Para cambios en flujos sin cobertura, sigue las comprobaciones manuales enlazadas en el [índice](../README.md). Usa datos sintéticos, comprueba persistencia tras recargar cuando corresponda y verifica exportación e importación si cambias el formato o el almacenamiento. No uses claves ni fotos reales en fixtures.

Los scripts vigentes están en [`package.json`](../../package.json). No hay un script configurado de lint ni de formato.
