## Context

- **Motivation**: ver proposal.md — Why.
- **Constraints**: 100% client-side (Dexie/IndexedDB), sin backend, estático en Cloudflare Pages, accesibilidad estricta (WCAG AAA, botones grandes, simplicidad).

## Goals / Non-Goals

**Goals:**
- PWA rápida y accesible en React + Vite + TypeScript.
- Persistencia offline (Dexie/IndexedDB + Storage API).
- Exportación a PDF (jsPDF) y a JSON.
- Instalable vía vite-plugin-pwa.

**Non-Goals** (fase 2): sync/backend, OCR/IA, gráficas, recordatorios, restauración de backup.

## Decisions

### 1. Datos: Dexie.js sobre IndexedDB
IndexedDB > `localStorage` en capacidad/robustez para datos médicos; Dexie da API tipada en Promesas. Alternativa descartada: `sqlite-wasm` (demasiado pesado para el MVP).

### 2. PDF: jsPDF
Genera el PDF en cliente, sin servidor. Alternativa descartada: `react-pdf` (más complejo de empaquetar aquí).

### 3. Estilos: Tailwind CSS
Control directo de tamaños táctiles (`min-h-[48px]`, `text-2xl`) sin CSS custom.

### 4. Rangos de validación (aplica a todos los requisitos de entrada de datos)
Sistólica 50–250, diastólica 30–150, pulso 30–220; sistólica siempre > diastólica.

## Risks / Trade-offs

- **[Risk]** Pérdida de datos por borrado de caché → **[Mitigation]** `navigator.storage.persist()` + backup JSON exportable (solo exportación, sin restaurar aún — fase 2).
- **[Risk]** Web Share API sin soporte en algunos navegadores de escritorio → **[Mitigation]** fallback a `mailto:` o descarga directa.