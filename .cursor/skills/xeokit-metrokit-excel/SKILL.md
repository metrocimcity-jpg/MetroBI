---
name: xeokit-metrokit-excel
description: >-
  Builds and extends the MetroKit Excel add-in: xeokit 3D viewer for XKT, glTF
  and IFC embedded on the worksheet, with a show/hide settings task pane,
  NavCube, URL load, pick-to-sheet, and highlight-from-cells. Use when the user
  mentions MetroKit-Excel, Excel add-in, Office.js task pane, or MetroKit in Excel.
---

# MetroKit Excel

The add-in lives in `MetroKit-Excel/`. Read [MetroKit-Excel/README.md](../../../MetroKit-Excel/README.md) first. Viewer behavior matches [MetroKit](../../../MetroKit/README.md); host is Excel, not Power BI.

Office allows one manifest type per add-in, so this project sideloads two manifests that share one site:

- On-sheet viewer: `src/content.ts` + `manifest-content.xml` (content add-in)
- Settings sidebar: `src/taskpane.ts` + `manifest.xml` (Home or Insert → MetroKit → Settings). Insert copies a viewer onto the sheet.
- Shared settings: `src/bridge.ts` (hidden sheet `MetroKitConfig`)
- Viewer + plugins: `src/viewer.ts`
- Sheet I/O: `src/excel.ts`
- Run `npm run build` / `npm start` / `npm run preview` from `MetroKit-Excel/` (not repo root)

## Constraints

- URL only — no Browse / file picker. Sanitize to `http`/`https`. Fetch as `ArrayBuffer` (CORS).
- Webpack `resolve.fallback`: `fs` and `path` false (xeokit).
- Do not put the 3D canvas back in the task pane. The viewer stays on the sheet.
- Preview without Excel must still boot (`Office.onReady` optional).
- Do not restore a Power BI Format pane or `pbiviz` packaging here.

Attach `MetroKit-Excel/.cursor/prompts/00-settings.md` when changing settings cards.
