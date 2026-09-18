---
name: xeokit-metrokit
description: >-
  Builds and extends the MetroKit xeokit Power BI visual for XKT, glTF and IFC
  models, NavCube, orbit navigation, and object picking. Use when the user
  mentions xeokit, XKT, IFC, glTF, BIM viewer, NavCube, or MetroKit.
---

# MetroKit xeokit

The visual lives in `MetroKit/`. Read [MetroKit/README.md](../../../MetroKit/README.md) first.

- Viewer + plugins: `MetroKit/src/xeokitViewer.ts`
- Format pane persist: `settings.ts` + `format.ts` + `formattingModel.ts` + `capabilities.json`
- Prompts: `MetroKit/.cursor/prompts/`
- Run `npm run package` from `MetroKit/` (not repo root)

## Format pane

Landing page with **no fields** must still save URL and toggles:

- `supportsLandingPage` and `supportsEmptyDataView`
- empty `{}` dataView condition
- slice `selector: null`; `forceNullSelectors` in `getFormattingModel`
- apply `metadata.objects` via `applyFormattingObjects` (do not trust `populateFormattingSettingsModel` alone)
- `renderingFinished` immediately; fetch XKT as `ArrayBuffer` for CORS
- `WebAccess` must list localhost explicitly
- no file picker in the Format pane

Attach `MetroKit/.cursor/prompts/00-format-pane.md` when changing Format cards.
