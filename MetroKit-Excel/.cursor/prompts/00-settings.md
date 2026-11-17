# Cursor prompt: MetroKit Excel settings

Use the MetroKit Excel skill. Settings live in `MetroKit-Excel/src/settings.ts` and the accordion in `src/taskpane.html`.

- The viewer is the content add-in (`src/content.ts`, `manifest-content.xml`), embedded on the sheet.
- Settings are the task pane (`src/taskpane.ts`, `manifest.xml`). **Home** or **Insert → MetroKit → Settings** opens it (`ShowTaskpane`). Close the pane to hide it. This Excel skips `VersionOverrides` 1.1, so the ribbon stays on VersionOverrides V1_0 and does not call `Office.addin.showAsTaskpane` / `hide`.
- **Insert** runs `insertMetroKit` in `src/commands.ts` (same group on Home and Insert). It copies an existing `OfficeApp` / `MetroKit` shape, or inserts the bundled workbook (`src/viewerTemplate.ts`) and copies that shape onto the active sheet. Report status with `Office.context.document.settings` (`metrokitInsertStatus`). The task pane polls that setting. Do not call `addHandlerAsync` for `SettingsChanged`.
- Persist with `publishSettings` in `src/bridge.ts` (hidden sheet `MetroKitConfig` plus `localStorage` key `metrokit-excel-settings`).
- Default model URL is `http://localhost/metrobi/1.xkt`.
- Mirror MetroKit Format cards: Model, Camera, 3D cube, Appearance, Selection.
- Changing a control (except typing the URL) publishes settings. URL commits on Load, From cell, or Enter. The content page picks them up.
- No Browse / file picker. URL only (`http`/`https`).
- Works without Excel: `Office.onReady` is optional; sheet actions no-op when `isExcelHost()` is false.
