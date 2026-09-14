## Why

Users need the ability to restore or merge previously exported JSON backup files into the app's local IndexedDB without overwriting or destroying existing readings. Currently, the backup feature only supports full export and destructive import (clearing all existing data). Adding JSON backup import with intelligent deduplication and manual validation ensures users can safely restore backups, merge data from multiple sources, and keep their records intact.

## What Changes

- Add JSON backup import capability with merge and deduplication semantics into IndexedDB:
  - Deduplication: a record in the file is considered a duplicate if ALL its core fields (`systolic`, `diastolic`, `pulse`, `timestamp`, and `notes`) match an existing record exactly. Comparison is strictly by values, ignoring internal database `id`s. Duplicates are skipped; unique valid records are added.
  - Validation: each imported record must pass the exact same manual entry validation rules (systolic: 40-250, diastolic: 20-160, pulse: 10-250, valid timestamp/date). Invalid records are discarded without aborting the entire import.
  - Robust file handling: checks that the uploaded file is valid JSON with the expected array/record schema. If invalid, shows a clear error to the user without touching existing data.
  - Explicit confirmation modal/dialog: before persisting to IndexedDB, displays a clear summary (number of new records to import, number of duplicates skipped, number of invalid records discarded) requiring explicit user confirmation.
- UI: Add an "Importar" (Import JSON backup) button right next to the existing export button in the backup section.

## Capabilities

### New Capabilities
- `json-backup-import`: Importing JSON backup files with merging, deduplication, validation, and confirmation dialog.

### Modified Capabilities
- `blood-pressure-tracker`: Update backup and restore requirements to support non-destructive JSON backup import with deduplication and validation.

## Impact

- `src/db.ts`: Add `importDatabaseFromJsonWithDeduplication` or refine backup import logic.
- `src/App.tsx`: Add file input handler, validation, summary state/modal for import confirmation, and UI button next to export backup.
- `openspec/specs/blood-pressure-tracker/spec.md`: Update or add requirements for JSON backup import.
