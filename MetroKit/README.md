# MetroKit — xeokit model viewer

Power BI custom visual built on [xeokit SDK](https://xeokit.io) for 3D BIM/CAD models.

It loads **XKT**, **glTF/GLB**, and **IFC**, with orbit/pan/zoom, object pick, and a **3D NavCube**.

## Features

- **XKT** via `XKTLoaderPlugin` (best path for large IFC — convert with [convert2xkt](https://xeokit.github.io/xeokit-convert))
- **glTF / GLB** via `GLTFLoaderPlugin`
- **IFC** via `WebIFCLoaderPlugin` and the bundled `web-ifc` 0.0.51 WASM (use XKT for big files)
- **Chart highlight** — a Power BI chart that shares Object ID highlights only the selected elements
- **Navigation** — orbit, first person, plan view; perspective or ortho; double-click fly-to-object
- **3D cube** — `NavCubePlugin` (faces/edges/corners snap the camera)
- **Pick** — highlight, optional X-ray of the rest, name/type overlay, Power BI cross-filter by Object ID
- **Appearance** — edges, SAO, background, hide `IfcSpace`

## Power BI fields

| Field well | Role |
| --- | --- |
| Object ID | xeokit / IFC entity id to highlight and filter |
| Label | Optional display name |
| Model URL | Optional URL column (otherwise use Format → Model URL) |
| Color by | Reserved for measure-driven color |
| Tooltips | Extra rows for the picked object |

## Format pane

- **Model** — URL, format (auto/xkt/gltf/ifc), edges, SAO, hide IfcSpace
- **Camera** — orbit / first person / plan, perspective / ortho, fit on load, fly-to
- **3D cube** — show, size, corner, fly vs jump
- **Appearance** — background, highlight, X-ray others
- **Selection** — cross-filter on pick

Paste a model URL in Format → Model → Model URL (or bind the Model URL field well). Settings persist with **no fields bound**. HTTPS hosts and `http://localhost` / `http://127.0.0.1` are allowed. The model host must send CORS headers. Power BI needs the visual’s `WebAccess` privilege. After changing the URL, press Enter or click outside the box so the value commits. The **Browse** button is on the top edge of the viewer. It copies the chosen `.ifc`, `.xkt`, `.glb`, or `.gltf` file into `preview/` and writes `https://localhost:8091/...` into Model URL. `npm run preview:https` must be running. A Browse row in the Format pane crashes Power BI, so it is not there. `https://localhost:8091/browse.html` does the same copy outside Power BI.

## Chart highlight

Bind **Object ID** to the same id a chart or table uses. The element CSV’s **Object ID** column is the IFC GlobalId from `scripts/export-ifc-elements.cjs`. When that chart filters MetroKit down to a subset, only those objects highlight. The full row set leaves the model unhighlighted. **X-ray unselected** x-rays everything else. `supportsHighlight` stays false: selection arrives as a smaller data view, or as a `highlights` array when the host sends one (`resolveChartHighlight` in `src/dataView.ts`). Ids must exist on the loaded model (`scene.objects`).

## IFC WASM

The visual imports `web-ifc` from this package (0.0.51, the build xeokit 2.6.114 expects). WASM loads from `https://localhost:8091/web-ifc/`, which `npm run preview:https` serves from `preview/web-ifc/` with the pbiviz dev certificate and CORS. `https://localhost:*` is in `WebAccess`. That web-ifc build rejects IFC4X3_ADD2; convert those files to XKT.

## Sample elements and fill rates

```powershell
node scripts/export-ifc-elements.cjs preview\1.ifc preview\1-elements.csv
node scripts/fill-rates.cjs preview\L-AC-AE-PD-F0327-HVC0-M3D-20003_IFC4x3-elements.csv preview\L-AC-AE-PD-F0327-HVC0-M3D-20003_IFC4x3-fill-rates.csv
node scripts/write-fill-dax.cjs
```

Import an elements CSV into Power BI and bind **Object ID** on MetroKit and on the chart. The first eight columns (Object ID through Material) are identity; fill rate covers the property columns after those. `preview/fill.dax` is the calculated table for the HVAC export.

## Develop

```powershell
cd MetroKit
npm install
npm run package
npm run preview:https
```

`npm run package` applies `scripts/patch-pbiviz-webpack.cjs` (`fs`/`path` fallbacks, certificate shell). Import `MetroKit/dist/*.pbiviz` in Power BI Desktop (enable **Develop a visual**). Current visual version is **1.0.14.0**.

`npm run preview:https` serves `preview/` at `https://localhost:8091`, including the IFC WASM the visual loads. Standalone preview without Power BI: open `preview/index.html` (that page loads xeokit and web-ifc from jsDelivr).

## Notes

- xeokit is **AGPL-3.0**. Commercial closed-source use needs a license from [Creoox](https://xeokit.io).
- OSM-style 403s do not apply here; models load over HTTPS from the URL you set.
- Large IFC files should be converted to XKT instead of parsed in the browser.

## Cursor prompts

Attach any file in `MetroKit/.cursor/prompts/`:

| Prompt | Use when |
| --- | --- |
| [00-format-pane.md](.cursor/prompts/00-format-pane.md) | Format pane URL/toggles with no fields bound |
| [01-load-model.md](.cursor/prompts/01-load-model.md) | XKT / glTF / IFC load and CORS |
| [02-navcube-camera.md](.cursor/prompts/02-navcube-camera.md) | orbit camera and 3D cube |
| [03-picking.md](.cursor/prompts/03-picking.md) | pick, chart highlight, cross-filter |
| [04-extend-visual.md](.cursor/prompts/04-extend-visual.md) | add a Format setting or loader path |
| [05-ifc-chart.md](.cursor/prompts/05-ifc-chart.md) | IFC WASM, element CSV, fill-rate chart |

Project skill: `.cursor/skills/xeokit-metrokit/`. Rule: `.cursor/rules/metrokit-xeokit.mdc`.

## Architecture

```
src/visual.ts          Power BI IVisual, Format persist, resize vs data
src/settings.ts        Format pane cards (selector null; match capabilities)
src/format.ts          Unwrap persisted objects; enumerateObjectInstances
src/formattingModel.ts Null selectors for getFormattingModel
src/dataView.ts        Object ID / URL field wells, chart highlight
src/xeokitViewer.ts    Viewer, ArrayBuffer loaders, NavCube, picking
scripts/               IFC element export, fill-rate CSV, fill DAX, HTTPS preview
```
