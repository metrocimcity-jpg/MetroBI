# Cursor prompt: extend MetroKit Excel

Work in `MetroKit-Excel/`. Sideload with `npm start`; preview with `npm run preview` (HTTPS :3000).

When adding a setting:

1. Add the field to `src/settings.ts` defaults + merge.
2. Add the control in `src/taskpane.html` and bind it in `src/taskpane.ts`.
3. Apply it in `src/viewer.ts` (or `src/excel.ts` for sheet behavior).

When adding a loader path, keep ArrayBuffer + CORS fetch. Do not add a file picker.

Manifest (`manifest.xml`) is an Excel **Workbook** task pane, `ReadWriteDocument`, source `https://localhost:3000/taskpane.html`. Ribbon button: Home → MetroKit.

xeokit is AGPL-3.0. Bump `src/version.ts` with user-facing changes.
