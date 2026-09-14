## Context

See proposal.md - Why. The app currently supports full export to JSON (`exportDatabaseToJson`) and a destructive import (`importDatabaseFromJson` which clears all records and bulk adds). We need a non-destructive merge import with schema validation, value-based deduplication, standard validation rules, and an explicit confirmation summary UI.

## Goals / Non-Goals

**Goals:**
- Parse and validate JSON backup files safely.
- Compare incoming records against existing IndexedDB records by value (`systolic`, `diastolic`, `pulse`, `timestamp`, `notes`), ignoring `id`.
- Apply manual entry validation ranges (systolic 40-250, diastolic 20-160, pulse 10-250, valid date).
- Provide an import confirmation modal showing counts (new, duplicates omitted, invalid discarded).
- Add an "Importar" button in the backup section next to the export backup button.

**Non-Goals:**
- Field-by-field merge of partial conflicts.
- Importing from arbitrary third-party non-export formats.
- Migration of legacy export formats.

## Decisions

1. **Deduplication Logic**:
   - Compare `systolic`, `diastolic`, `pulse`, `timestamp` (normalized or exact ISO string), and `notes` (handling `undefined`/`null`/empty string normalization).
   - Ignore `id` property from JSON records.
   - Also deduplicate within the imported file itself if it contains duplicate entries.

2. **Validation Rules**:
   - Reuse exact validation checks from manual entry:
     - `systolic`: number between 40 and 250.
     - `diastolic`: number between 20 and 160.
     - `pulse`: number between 10 and 250.
     - `timestamp`: valid date parseable via `new Date(timestamp)`.
   - Discard invalid records without failing the entire import batch.

3. **UI Workflow**:
   - Hidden file `<input type="file" accept=".json,application/json" ... />` triggered by clicking the "Importar" button in the backup section of App.tsx.
   - Upon file selection, read text, parse JSON. If parsing fails or not an array, show error alert/toast and abort.
   - Run validation and deduplication calculations in memory.
   - Open a confirmation modal displaying:
     - Total records in file
     - New valid records to import
     - Duplicates omitted
     - Invalid records discarded
   - User clicks "Confirmar e importar" -> persist new records using `addReading` or `bulkAdd` with computed `period`, then reload readings and show success message.
   - User clicks "Cancelar" -> do nothing.

## Risks / Trade-offs

- [Large backup files] → Processed efficiently in memory (typical app usage is hundreds of records, well within browser memory limits).
- [Timestamp format differences] → Standardize comparison using `new Date(item.timestamp).getTime()` or exact ISO string comparison.
