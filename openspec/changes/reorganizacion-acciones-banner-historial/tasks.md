## 1. Header & Actions Reorganization

- [ ] 1.1 Update `src/App.tsx` header to feature primary action buttons ("Nueva Toma" and "Foto y listo") prominently without duplication and verify click handlers open respective modals.
- [ ] 1.2 Add an independent gear icon button in the header that opens the Gemini API Key modal (`ApiKeyModal`) and verify it opens correctly.
- [ ] 1.3 Create a consolidated auxiliary tools dropdown / popover menu ("Más opciones") in the header containing PDF export, Share, Backup (JSON export), and Import JSON options, and verify each triggers its respective handler.

## 2. Persistent Storage Banner Refactoring

- [ ] 2.1 Refactor the persistent storage alert in `src/App.tsx` from a saturated full-width banner to a discrete, dismissible notice banner with an dismiss button (`X`).
- [ ] 2.2 Implement `localStorage` persistence for the dismissed state so the notice stays dismissed once closed, and verify dismissing it hides the notice across renders.

## 3. History Two-Column & Mobile Layout Reorganization

- [ ] 3.1 Update the history section in `src/App.tsx` to group readings per day into a responsive two-column grid on desktop/tablet (`md:`), where the left column houses "Mañana" readings and the right column houses "Tarde" and "Noche" readings combined.
- [ ] 3.2 Ensure mobile view collapses to a single column with readings stacked in reverse chronological order within each day, and verify both layouts render correctly against the existing time slot definitions.
