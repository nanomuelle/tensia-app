## Why

Los mayores de 50 años que controlan su tensión en casa dependen de libretas o hojas de cálculo: tedioso, propenso a errores, difícil de compartir con el médico. Se necesita una PWA simple, de números grandes, accesible, offline-first y sin servidores ni cuentas.

## What Changes

- **New Capability**: PWA "Tensia" de registro y consulta de tensión arterial para adultos mayores.
- Alta de lectura: sistólica, diastólica, pulso, fecha/hora automática editable.
- Edición y borrado de lecturas ya guardadas.
- Interfaz accesible: números grandes, alto contraste, controles táctiles ≥48px.
- Histórico agrupado por día y franja horaria (mañana/tarde/noche).
- Exportación a PDF y compartir vía Web Share API (fallback `mailto:`).
- Backup: exportación de la base de datos a JSON (sin restauración por ahora).
- Persistencia reforzada (`navigator.storage.persist()`) + PWA instalable offline.

## Capabilities

### New Capabilities
- `blood-pressure-tracker`: registro, edición, histórico, exportación PDF/JSON y accesibilidad para la PWA.

### Modified Capabilities
*(Ninguna — aplicación nueva)*

## Impact

- **Código**: nuevo directorio del proyecto (ver README) — React, Vite, Tailwind, Dexie.js.
- **Dependencias**: `dexie`, `jspdf`, `vite-plugin-pwa`, `lucide-react`.
- **Infraestructura**: estático, listo para Cloudflare Pages, sin backend.