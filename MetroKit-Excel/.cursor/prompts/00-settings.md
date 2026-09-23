# Cursor prompt: MetroKit Excel settings

Use the MetroKit Excel skill. Settings live in `MetroKit-Excel/src/settings.ts` and the accordion in `src/taskpane.html`.

- The viewer is the content add-in (`src/content.ts`, `manifest-content.xml`), embedded on the sheet.
- Settings are the task pane (`src/taskpane.ts`, `manifest.xml`). Home → MetroKit → Settings shows or hides it.
- Persist with `publishSettings` in `src/bridge.ts` (hidden sheet `MetroKitConfig` plus `localStorage` key `metrokit-excel-settings`).
- Default model URL is `http://localhost/metrobi/1.xkt`.
- Mirror MetroKit Format cards: Model, Camera, 3D cube, Appearance, Selection.
- Changing a control (except typing the URL) publishes settings. URL commits on Load, From cell, or Enter. The content page picks them up.
- No Browse / file picker. URL only (`http`/`https`).
- Works without Excel: `Office.onReady` is optional; sheet actions no-op when `isExcelHost()` is false.
