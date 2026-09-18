# MetroBI

Power BI custom visuals:

| Folder | Visual |
| --- | --- |
| [MetroMap](MetroMap/README.md) | Leaflet maps (WMS, GeoJSON, shapefile) |
| [MetroKit](MetroKit/README.md) | xeokit 3D viewer (XKT, glTF, IFC, NavCube) |

Cursor prompts (attach in chat when extending a visual):

- MetroMap: [MetroMap/.cursor/prompts](MetroMap/.cursor/prompts)
- MetroKit: [MetroKit/.cursor/prompts](MetroKit/.cursor/prompts)

Format pane URLs and on/off settings persist with **no fields bound**. Text boxes commit on Enter. `http://localhost` needs an explicit `WebAccess` entry (not covered by `http://*`).

```powershell
cd MetroMap
npm install
npx pbiviz package

cd ..\MetroKit
npm install
npx pbiviz package
```
