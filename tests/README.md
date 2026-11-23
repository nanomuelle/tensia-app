# Pruebas del informe AMPA

Ejecuta `npm test` con Node 24 para comprobar los cálculos y la estructura del PDF.

Instala Chromium con `npx playwright install chromium` y ejecuta `npm run test:e2e`
para probar el formulario, la persistencia y la descarga. Playwright arranca Vite
y usa un perfil de navegador aislado con lecturas sintéticas.
