# Repository Guidelines

## Project Structure

Tensia is a Spanish-language blood pressure tracker built with React, TypeScript, Vite, and Tailwind CSS. The app starts in `src/main.tsx`, and `src/App.tsx` assembles the main screen. Put reusable UI in `src/components/`, React state and browser workflows in `src/hooks/`, and data access, validation, Gemini photo recognition, and PDF export in `src/services/`. The app stores readings locally using Dexie and IndexedDB. Global styles live in `src/index.css`, and the PWA manifest and service worker settings live in `vite.config.ts`. Consult `openspec/specs/` for expected behavior and `openspec/changes/` for proposals and design notes.

## Development Commands

- `npm ci` installs dependencies from the committed lockfile.
- `npm run dev` starts the Vite development server with hot reload.
- `npm run build` runs TypeScript checks and generates the production build in `dist/`.
- `npm run preview` serves the production build locally after a build.

## Coding Style

Use two-space indentation and follow the surrounding file’s quote and semicolon style. Name components and their files in PascalCase, as in `ReadingModal.tsx`. Prefix hooks with `use`, as in `useReadings.ts`, and follow the service naming pattern in `readingsService.ts`. Use Tailwind utilities for component styling and keep user-facing strings in Spanish. The project has no configured lint or formatting script.

## Testing

There is no configured automated test runner or coverage threshold. Run `npm run build` and verify the affected flows in a browser. For storage or backup changes, use synthetic readings to check persistence after reload and confirm that JSON export and import preserve the expected data. Use the production preview for PWA changes.

## Commits and Pull Requests

Keep commit subjects short and scoped. Recent examples include `refactor/split-app-in-components` and `feature/importar-backup-json`. In pull requests, summarize the behavior change, link the relevant issue or OpenSpec proposal when available, and list the checks you ran. Include screenshots for visible UI changes and use sample data in screenshots and backups. Keep API keys and local environment files out of commits.
