# Cursor prompt: load XKT / glTF / IFC

Use the MetroKit xeokit skill and [00-format-pane.md](00-format-pane.md).

Loaders live in `MetroKit/src/xeokitViewer.ts`. Prefer **XKT** (`XKTLoaderPlugin`) for large IFC. Convert with [convert2xkt](https://xeokit.github.io/xeokit-convert). Parse IFC in-browser (`WebIFCLoaderPlugin` + web-ifc WASM) only for small files. glTF/GLB uses `GLTFLoaderPlugin`.

Requirements:

- URL comes from Format → Model URL, or the Model URL field well if bound. Sanitize to `http`/`https` only.
- `detectFormat` from the URL extension unless Format is not Auto.
- `fetch` with `mode: "cors"` into an `ArrayBuffer`, then `xktLoader.load({ xkt: buffer, edges, saoEnabled, excludeTypes })` (and the glTF/IFC equivalents). Do not pass `src` when CORS is involved.
- Reload when the signature changes: url + format + edges + sao + excludeSpaces.
- Hide `IfcSpace` via `excludeTypes: ["IfcSpace"]` when that toggle is on.
- Time out hung parses; show errors on the canvas status element, not via `renderingFailed`.
- Keep one `Viewer`. Resize the canvas on Power BI resize. `viewer.destroy()` only in `destroy()`.
