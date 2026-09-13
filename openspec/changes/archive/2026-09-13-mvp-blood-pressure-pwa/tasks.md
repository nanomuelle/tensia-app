## 1. Setup y Estructura Base

- [ ] 1.1 Configurar `package.json` (`react`, `react-dom`, `dexie`, `jspdf`, `lucide-react`, `vite-plugin-pwa`). ✓ `npm run build` sin errores.
- [ ] 1.2 Configurar Tailwind CSS + TypeScript en Vite. ✓ Compila sin errores TS.
- [ ] 1.3 Configurar `vite-plugin-pwa` en `vite.config.ts` (manifest + service worker). ✓ Build genera `sw.js` y `manifest.webmanifest`.

## 2. Base de Datos y Modelos

- [ ] 2.1 Esquema Dexie: `id, systolic, diastolic, pulse, timestamp, period, notes`. ✓ IndexedDB se inicializa sin error.
- [ ] 2.2 Repositorio CRUD + filtrado por fecha/franja horaria. ✓ Test unitario o prueba en consola.

## 3. Interfaz de Usuario Accesible

- [ ] 3.1 Base Tailwind: botones ≥48px, alto contraste, números grandes. ✓ Revisión visual.
- [ ] 3.2 Alta de lectura (sistólica/diastólica/pulso, fecha/hora editable, validación de rangos). ✓ Registro válido e inválido probados.
- [ ] 3.3 Histórico agrupado por día y franja (mañana/tarde/noche). ✓ Revisión visual con datos de prueba.
- [ ] 3.4 Editar/borrar lectura desde histórico, con confirmación al borrar. ✓ Edición y borrado probados.

## 4. Exportación, Compartición y Backup

- [ ] 4.1 Generar PDF con jsPDF (tabla de registros). ✓ Descarga de PDF verificada.
- [ ] 4.2 Web Share API + fallback `mailto:`. ✓ Acción de compartir probada.
- [ ] 4.3 Exportar backup JSON (base de datos completa). ✓ Descarga de JSON verificada.

## 5. Persistencia y PWA Final

- [ ] 5.1 Solicitar `navigator.storage.persist()` al arrancar. ✓ Estado "persisted" en DevTools.
- [ ] 5.2 Verificar funcionamiento offline y build para Cloudflare Pages. ✓ `npm run build` + prueba offline en navegador.