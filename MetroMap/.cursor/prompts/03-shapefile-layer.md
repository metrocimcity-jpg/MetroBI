# Cursor prompt: shapefile layer

Leaflet has no native shapefile layer. Shapefile is a **Format pane URL**, not a field well. Follow [00-format-pane.md](00-format-pane.md) so the URL and style persist with no data bound.

Pipeline:

1. User pastes a CORS-enabled URL to a `.zip` (shp+dbf+prj) or `.shp` in Format → Shapefile layer. Press Enter or click outside to commit. There is no Browse button in the Format pane.
2. `fetch` the resource as `ArrayBuffer` (`WebAccess` required). Local Apache/WAMP files need explicit `http://localhost` / `http://127.0.0.1` privileges and CORS headers.
3. Parse with `shpjs` to GeoJSON in WGS84.
4. If `shpjs` returns an array (zip with multiple shapefiles), flatten into one `FeatureCollection`.
5. Render with the same `L.geoJSON` helper used for GeoJSON (style, circle markers, popups, highlight).
6. Add the result to `L.control.layers` as overlay "Shapefile".

Implementation lives in `MetroMap/src/layerLoaders.ts` (`fetchShapefile`) and `MetroMap/src/leafletMap.ts`.

Do not try to add `.shp` as a `TileLayer` or `ImageOverlay`. Do not assume shapefile coordinates are already lat/lng — `shpjs` reprojects using `.prj` when present. Do not hang the Format pane waiting on a large zip; keep `renderingFinished` immediate.
