## Purpose

Allows users to import JSON backup files, merging records into IndexedDB with deduplication, manual entry validation, and explicit user confirmation before persisting.

## ADDED Requirements

### Requirement: JSON Backup File Validation
The system SHALL validate uploaded JSON backup files to ensure they contain a valid JSON array of blood pressure records matching the expected schema. If the file is invalid JSON or lacks the correct structure, the system SHALL display a clear error message to the user and leave existing IndexedDB data untouched.

#### Scenario: Valid JSON file uploaded
- **WHEN** the user selects a valid JSON export backup file
- **THEN** the file is parsed successfully and proceeds to record analysis.

#### Scenario: Invalid JSON or incorrect schema uploaded
- **WHEN** the user selects a corrupted JSON file or a non-array JSON object
- **THEN** the system shows a clear error message and does not modify the database.

### Requirement: Record Deduplication and Validation
The system SHALL filter imported records by applying manual entry validation rules (systolic 40-250, diastolic 20-160, pulse 10-250, valid timestamp) and exact-value deduplication against existing records in IndexedDB. A record is a duplicate if all its core fields (`systolic`, `diastolic`, `pulse`, `timestamp`, `notes`) match an existing record exactly, ignoring internal `id` values.

#### Scenario: Duplicate and invalid records filtering
- **WHEN** the system processes parsed import items
- **THEN** invalid items are discarded, exact duplicates against existing records are omitted, and unique valid items are counted as new.

### Requirement: Pre-Persistence Confirmation Summary
The system SHALL display a summary modal showing the count of new records to import, duplicates omitted, and invalid records discarded, and require explicit user confirmation before writing to IndexedDB.

#### Scenario: User confirms import
- **WHEN** the user views the summary and clicks confirm
- **THEN** only the new validated records are added to IndexedDB and a success message is displayed.

#### Scenario: User cancels import
- **WHEN** the user clicks cancel on the import summary modal
- **THEN** the import operation is aborted and no data is written.
