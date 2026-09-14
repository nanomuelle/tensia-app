## Why

The user interface of Tensia needs UX reorganization and clarity improvements for elderly users and general usability. Specifically:
1. Primary actions ("Nueva Toma" and "Foto y listo") should be prominently visible and unduplicated on the header.
2. API Key configuration should be housed in an independent gear icon outside primary actions.
3. Auxiliary tools (PDF export, Share, Backup/JSON export, Import JSON) must be grouped into a single dropdown / "more options" menu rather than equal-hierarchy cards.
4. Persistent storage banner must be streamlined into a discrete, dismissible notice.
5. Reading history on desktop/tablet should be presented in a two-column layout grouping Morning on the left, and Afternoon + Night on the right for each day, while collapsing to a single chronological column on mobile.

## What Changes

- Reorganize header actions:
  - Keep "Nueva Toma" and "Foto y listo" as primary persistent action buttons.
  - Extract Gemini API key settings to a separate gear icon button.
  - Group auxiliary utilities (Export PDF, Share, Backup JSON, Import JSON) into a single dropdown/popover menu ("Más opciones" / utilities menu).
- Streamline persistent storage notification:
  - Replace full-width saturated banner with a discrete, dismissible notice banner.
- Reorganize history view layout:
  - Desktop/tablet: Two columns per day (Left column: Morning [06:00–11:59]; Right column: Afternoon [12:00–19:59] & Night [20:00–05:59] combined into the right column). Individual readings retain their period labels.
  - Mobile: Single column with readings stacked in reverse chronological order within the day.

## Capabilities

### Modified Capabilities
- `blood-pressure-tracker`: Update UI layout requirements for primary actions, settings gear, consolidated utilities menu, dismissible storage notice, and two-column/mobile history grouping.

## Impact

- `src/App.tsx`: Main layout, header actions bar, storage notice component, history day-grouping rendering logic.
- UI components: possible addition or update of menu dropdown components or styling for the new layouts.
