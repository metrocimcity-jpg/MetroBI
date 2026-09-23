# MetroKit Excel — xeokit model viewer

Excel add-in built on [xeokit SDK](https://xeokit.io). Same viewer as [MetroKit](../MetroKit/README.md): **XKT**, **glTF/GLB**, and **IFC**, with orbit/pan/zoom, object pick, and a **3D NavCube**.

The 3D view is embedded on the worksheet (resize it like a chart). Settings live in the Excel sidebar, which you can show or hide.

## Use in Excel

1. **Insert → My Add-ins → MetroKit** — places the viewer on the sheet.
2. **Home → MetroKit → Settings** — opens the sidebar. Click it again, or close the pane, to hide it.

## Features

- **URL load** — paste a model URL and click Load. Settings persist in the workbook (no file picker).
- **From cell** — read the selected cell as the model URL.
- **Pick → sheet** — writing the picked object id / name / type into the selection (when Write pick to sheet is on).
- **Highlight from sheet** — select cells with object IDs and highlight them in the model.
- **Navigation** — orbit, first person, plan view; perspective or ortho; double-click fly-to-object.
- **3D cube** — `NavCubePlugin` (faces/edges/corners snap the camera).
- **Appearance** — edges, SAO, background, hide `IfcSpace`.

Browser preview (no Excel): `https://localhost:3000/content.html` is the viewer and `https://localhost:3000/taskpane.html` is the settings sidebar.

## Settings

Mirrors the MetroKit Format pane. Stored in a hidden workbook sheet so the on-sheet viewer and the sidebar stay in sync, and in `localStorage` (`metrokit-excel-settings`) for browser preview.

- **Model** — URL, format (auto/xkt/gltf/ifc), edges, SAO, hide IfcSpace
- **Camera** — orbit / first person / plan, perspective / ortho, fit on load, fly-to
- **3D cube** — show, size, corner, fly vs jump
- **Appearance** — background, highlight, X-ray others
- **Selection** — write pick to sheet; highlight IDs from the current selection

HTTPS hosts and `http://localhost` / `http://127.0.0.1` are allowed. The model host must send CORS headers. There is no Browse/file picker.

## Develop

```powershell
cd MetroKit-Excel
npm install
npm run build
npm run preview
```

Sideload in Excel (Desktop):

```powershell
cd MetroKit-Excel
npx office-addin-dev-certs install
npx office-addin-dev-settings register manifest-content.xml
npx office-addin-dev-settings register manifest.xml
npm start
```

Trust the localhost certificate if Excel or the browser prompts. Insert the viewer from **Insert → My Add-ins → MetroKit**. Open settings from **Home → MetroKit → Settings**.

Validate the manifest:

```powershell
npm run validate
```

## Notes

- xeokit is **AGPL-3.0**. Commercial closed-source use needs a license from [Creoox](https://xeokit.io).
- Large IFC files should be converted to XKT instead of parsed in the browser.
- Webpack sets `fs`/`path` fallbacks to `false` for xeokit.

## Cursor prompts

Attach any file in `MetroKit-Excel/.cursor/prompts/`:

| Prompt | Use when |
| --- | --- |
| [00-settings.md](.cursor/prompts/00-settings.md) | Settings sidebar and on-sheet viewer sync |
| [01-load-model.md](.cursor/prompts/01-load-model.md) | XKT / glTF / IFC load and CORS |
| [02-navcube-camera.md](.cursor/prompts/02-navcube-camera.md) | orbit camera and 3D cube |
| [03-sheet-pick.md](.cursor/prompts/03-sheet-pick.md) | pick → sheet and highlight from cells |
| [04-extend-addin.md](.cursor/prompts/04-extend-addin.md) | add a setting or loader path |

Project skill: `.cursor/skills/xeokit-metrokit-excel/`. Rule: `.cursor/rules/metrokit-excel.mdc`.

## Architecture

```
src/content.ts         On-sheet viewer (content add-in)
src/taskpane.ts        Settings sidebar; Home → Settings shows or hides it
src/bridge.ts          Shared settings in a hidden workbook sheet
src/settings.ts        Defaults and localStorage
src/viewer.ts          Viewer, ArrayBuffer loaders, NavCube, picking
src/excel.ts           write pick / read cell URL / read selected IDs
manifest-content.xml   Content add-in embedded on the sheet
manifest.xml           Task pane add-in for the settings sidebar
```
