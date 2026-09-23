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

Format pane URLs and on/off settings persist with **no fields bound**. Text boxes commit on Enter. `http://localhost` needs an explicit `WebAccess` entry (not covered by `http://*`). MetroKit-Excel persists the same settings in `localStorage`.

```powershell
cd MetroMap
npm install
npx pbiviz package

cd ..\MetroKit
npm install
npx pbiviz package

cd ..\MetroD3
npm install
npx pbiviz package

cd ..\MetroKit-Excel
npm install
npm run build
```
