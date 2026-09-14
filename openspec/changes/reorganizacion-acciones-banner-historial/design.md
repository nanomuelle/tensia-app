## Context

See proposal.md. The application requires UI structural improvements for elderly users and general usability, specifically organizing header actions, moving settings to a gear icon, consolidating auxiliary tools into a dropdown menu, converting the storage banner into a discrete dismissible notice, and reorganizing history into a two-column desktop / single-column mobile view per day while respecting existing time slot definitions (Morning 06:00–11:59, Afternoon 12:00–19:59, Night 20:00–05:59).

## Goals / Non-Goals

**Goals:**
- Provide clear, non-duplicated primary action buttons ("Nueva Toma" and "Foto y listo") in the header.
- Add an independent gear icon button for Gemini API key settings.
- Implement a single dropdown/popover menu ("Más opciones") for auxiliary tools (PDF export, Share, JSON Backup, JSON Import).
- Redesign the persistent storage banner into a discrete, dismissible notice (dismissal is stored in `localStorage` for the session or permanently according to product choice; here stored permanently once dismissed by user in session/localStorage to avoid annoyance).
- Implement a two-column layout per day on desktop/tablet (Left column: Morning; Right column: Afternoon & Night) and single-column reverse-chronological list on mobile.

**Non-Goals:**
- Modifying blood pressure validation logic, photo recognition core algorithms, internal PDF generation libraries, or database storage mechanics.

## Decisions

- **Header Action Layout:** Place "Nueva Toma" and "Foto y listo" as prominent primary buttons on the header/top bar. Place the API key configuration behind a dedicated gear icon button. Place PDF, Share, Backup, and Import actions inside a single popover/dropdown menu ("Más opciones" / utilities menu) triggered by a menu button (e.g., three dots or folder/menu icon).
- **Persistent Storage Notice:** Change from full-width saturated banner to a subtle banner with a dismiss button (`X`), storing dismissed state in `localStorage` (`tensia_dismiss_persistence_banner = 'true'`) so it does not reappear persistently once dismissed.
- **History Two-Column Layout:** For screens `md` and above, each day section renders a 2-column CSS grid (`grid-cols-1 md:grid-cols-2 gap-4`). Left column contains readings where period is `Mañana` (06:00–11:59). Right column contains readings where period is `Tarde` (12:00–19:59) or `Noche` (20:00–05:59). If a column has no readings for that day/slot range, display a subtle placeholder or leave it clean. On mobile screens (`< md`), collapse to a single column with readings sorted in reverse chronological order.

## Risks / Trade-offs

- [Space constraint on small tablets] → Mitigation: Use responsive grid breakpoints (`md:grid-cols-2`) and compact cards inside columns.
- [Empty time slots in two-column day view] → Mitigation: Render appropriate empty state message or subtle card indicator per slot column when no readings exist for that specific slot on that day.
