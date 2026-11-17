# MetroBI

Power BI custom visuals and an Excel add-in:

| Folder | App |
| --- | --- |
| [MetroMap](MetroMap/README.md) | Leaflet maps (WMS, GeoJSON, shapefile) |
| [MetroKit](MetroKit/README.md) | xeokit 3D viewer (XKT, glTF, IFC, NavCube) |
| [MetroD3](MetroD3/README.md) | D3 zoomable sunburst |
| [MetroKit-Excel](MetroKit-Excel/README.md) | Excel add-in: xeokit viewer on the sheet, settings in the sidebar |

Cursor prompts (attach in chat when extending a visual):

- MetroMap: [MetroMap/.cursor/prompts](MetroMap/.cursor/prompts)
- MetroKit: [MetroKit/.cursor/prompts](MetroKit/.cursor/prompts)
- MetroD3: [MetroD3/.cursor/prompts](MetroD3/.cursor/prompts)
- MetroKit-Excel: [MetroKit-Excel/.cursor/prompts](MetroKit-Excel/.cursor/prompts)

Format pane URLs and on/off settings persist with **no fields bound**. Text boxes commit on Enter. `http://localhost` needs an explicit `WebAccess` entry (`http://*` does not cover localhost). MetroKit-Excel stores the same settings on the hidden `MetroKitConfig` sheet and in `localStorage`.

```powershell
cd MetroMap
npm install
npm run package

cd ..\MetroKit
npm install
npm run package

cd ..\MetroD3
npm install
npm run package

cd ..\MetroKit-Excel
npm install
npm run build
```

## Release

Pushing a `v*` tag runs [`.github/workflows/release.yml`](.github/workflows/release.yml). The workflow packages MetroMap, MetroKit, and MetroD3, builds MetroKit-Excel, and publishes one GitHub release with all four files.

Current release: [v1.0.0](https://github.com/metrocimcity-jpg/MetroBI/releases/tag/v1.0.0) — MetroMap 1.0.1.0, MetroKit 1.0.11.0, MetroD3 1.0.0.0, MetroKit-Excel 1.1.0.
