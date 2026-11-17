# Cursor prompt: load XKT / glTF / IFC (Excel)

Use the MetroKit Excel skill and [00-settings.md](00-settings.md).

Loaders live in `MetroKit-Excel/src/viewer.ts`. Prefer **XKT** (`XKTLoaderPlugin`) for large IFC. Convert with [convert2xkt](https://xeokit.github.io/xeokit-convert). Parse IFC in-browser (`WebIFCLoaderPlugin` + web-ifc WASM) only for small files. glTF/GLB uses `GLTFLoaderPlugin`.

Requirements:

- URL comes from the Model URL box, or **From cell**. Sanitize to `http`/`https` only.
- `detectFormat` from the URL extension unless format is not Auto.
- `fetch` with `mode: "cors"` into an `ArrayBuffer`, then `xktLoader.load({ xkt: buffer, edges, saoEnabled, excludeTypes })` (and the glTF/IFC equivalents). Do not pass `src` when CORS is involved.
- Reload when the signature changes: url + format + edges + sao + excludeSpaces.
- Hide `IfcSpace` via `excludeTypes: ["IfcSpace"]` when that toggle is on.
- Time out hung parses; show errors on the canvas status element.
- Keep one `Viewer`. Resize the canvas on window resize. `viewer.destroy()` only on teardown.
- Webpack must set `resolve.fallback.fs` and `path` to `false`.
- Excel IFC loads web-ifc **0.0.51 from jsDelivr** and sets the WASM path to that package URL. Leave the Power BI visual’s `https://localhost:8091/web-ifc/` path in MetroKit.
