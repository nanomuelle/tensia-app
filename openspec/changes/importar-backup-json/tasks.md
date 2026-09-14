# Implementation Tasks

- [x] Add backend/database helper functions in `src/db.ts` for previewing and merging backup JSON data with deduplication and validation:
  - Validate JSON structure and array format.
  - Validate each item against range rules (systolic 40-250, diastolic 20-160, pulse 10-250, valid timestamp).
  - Compare incoming records against existing IndexedDB records by exact value (`systolic`, `diastolic`, `pulse`, `timestamp`, `notes`), ignoring `id`.
  - Return counts of new, duplicate, and invalid records along with the list of valid new records to insert.
- [x] Implement the Import UI in `src/App.tsx`:
  - Add hidden `<input type="file" accept=".json" ... />` and "Importar" button next to "Crear copia de seguridad" in the backup section.
  - Implement file change handler to parse JSON, run validation & deduplication analysis.
  - Build confirmation modal showing summary stats (new records to import, duplicates omitted, invalid discarded).
  - Handle confirmation to persist new records to IndexedDB and refresh the readings list with success feedback.
- [x] Write unit/integration tests or verify functionality by running tests/build.
- [x] Validate changes with `openspec validate importar-backup-json`.

