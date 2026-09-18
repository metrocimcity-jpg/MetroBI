# MetroKit — xeokit model viewer

Power BI custom visual built on [xeokit SDK](https://xeokit.io) for 3D BIM/CAD models.

It loads **XKT**, **glTF/GLB**, and **IFC**, with orbit/pan/zoom, object pick, and a **3D NavCube**.

## Features

- **XKT** via `XKTLoaderPlugin` (best path for large IFC — convert with [convert2xkt](https://xeokit.github.io/xeokit-convert))
- **glTF / GLB** via `GLTFLoaderPlugin`
- **IFC** via `WebIFCLoaderPlugin` + web-ifc WASM (use XKT for big files)
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

Paste a model URL in Format → Model → Model URL (or bind the Model URL field well). HTTPS hosts and `http://localhost` / `http://127.0.0.1` are allowed. The model host must send CORS headers. Power BI needs the visual’s `WebAccess` privilege. After changing the URL, click outside the box so the value commits.

## Develop

```powershell
cd MetroKit
npm install
npx pbiviz package
```

Import `MetroKit/dist/*.pbiviz` in Power BI Desktop (enable **Develop a visual**).

Standalone preview (no Power BI):

```powershell
# open MetroKit/preview/index.html
```

## Notes

- xeokit is **AGPL-3.0**. Commercial closed-source use needs a license from [Creoox](https://xeokit.io).
- OSM-style 403s do not apply here; models load over HTTPS from the URL you set.
- Large IFC files should be converted to XKT instead of parsed in the browser.

## Architecture

```
src/visual.ts         Power BI IVisual
src/settings.ts       Format pane
src/dataView.ts       Object ID / URL field wells
src/xeokitViewer.ts   Viewer, loaders, NavCube, picking
src/format.ts         URL format detection
```
