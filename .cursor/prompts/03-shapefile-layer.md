# Cursor prompt: shapefile layer

Leaflet has no native shapefile layer. Follow this pipeline:

1. User supplies a CORS-enabled URL to a `.zip` (shp+dbf+prj) or `.shp` in the Shapefile format card.
2. `fetch` the resource as `ArrayBuffer` (Power BI `WebAccess` privilege required).
3. Parse with `shpjs` to GeoJSON in WGS84.
4. If `shpjs` returns an array (zip with multiple shapefiles), flatten into one `FeatureCollection`.
5. Render with the same `L.geoJSON` helper used for GeoJSON (style, circle markers, popups, highlight).
6. Add the result to `L.control.layers` as overlay "Shapefile".

Implementation lives in `src/layerLoaders.ts` (`fetchShapefile`) and `src/leafletMap.ts`.

Do not try to add `.shp` as a `TileLayer` or `ImageOverlay`. Do not assume shapefile coordinates are already lat/lng — `shpjs` reprojects using `.prj` when present.
