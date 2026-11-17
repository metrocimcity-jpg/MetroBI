# Cursor prompt: IFC WASM, element table, and fill-rate chart

Use [01-load-model.md](01-load-model.md) and [03-picking.md](03-picking.md).

## WASM inside the visual

- Import `web-ifc` 0.0.51 from the MetroKit package (xeokit 2.6.114 expects this build).
- `IfcAPI.SetWasmPath("https://localhost:8091/web-ifc/", true)` then `Init()`.
- `npm run preview:https` serves `preview/web-ifc/` (`web-ifc.wasm`, `web-ifc-mt.wasm`, worker) with the pbiviz dev certificate and `Access-Control-Allow-Origin: *`.
- `WebAccess` already lists `https://localhost:*`. Keep that entry when the WASM host changes.

## Element CSV and fill rate

- `node scripts/export-ifc-elements.cjs <ifc> <csv>` writes one row per element. **Object ID** is the IFC GlobalId. The next seven columns (Name through Material) are identity. Later columns are property sets.
- `node scripts/fill-rates.cjs <elements.csv> <fill-rates.csv>` counts non-empty property columns (skips the first eight) and writes Parameter, Filled elements, Total elements, Filled percent.
- `node scripts/write-fill-dax.cjs` rewrites `preview/fill.dax` from the HVAC elements CSV. The DAX table name must match the Power BI table.
- In Power BI, bind the CSV **Object ID** column to MetroKit **Object ID** and to the chart that should drive highlight. A filtered subset highlights those objects; the full population clears the highlight.
