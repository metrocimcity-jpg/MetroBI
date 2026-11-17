# Cursor prompt: extend MetroKit Excel

Work in `MetroKit-Excel/`. Sideload with `npm start`; preview with `npm run preview` (HTTPS :3000).

When adding a setting:

1. Add the field to `src/settings.ts` defaults + merge.
2. Add the control in `src/taskpane.html` and bind it in `src/taskpane.ts`.
3. Apply it in `src/viewer.ts` (or `src/excel.ts` for sheet behavior).

When adding a loader path, keep ArrayBuffer + CORS fetch. Do not add a file picker.

`manifest.xml` is an Excel **Workbook** task pane, `ReadWriteDocument`, source `https://localhost:3000/taskpane.html`. Ribbon (VersionOverrides V1_0 only, on Home and Insert): **Insert** (`insertMetroKit`) and **Settings** (`ShowTaskpane`). Keep `manifest-content.xml` at version 1.0.0.0 together with the web extension in `assets/metrokit-viewer.xlsx`. After editing `src/commands.ts`, bump `commands.html?v=` in the task pane manifest.

The content page polls shared settings. The task pane polls `metrokitInsertStatus`. Do not register `Office.context.document.addHandlerAsync` for `SettingsChanged`.

xeokit is AGPL-3.0. Bump `src/version.ts` with user-facing changes.
