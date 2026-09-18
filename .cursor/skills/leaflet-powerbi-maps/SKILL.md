---
name: leaflet-powerbi-maps
description: >-
  Builds and extends the MetroBI Leaflet Power BI visual using Leaflet 1.9.4 APIs
  for interactive maps, WMS, GeoJSON, shapefiles, choropleth styling, popups,
  tooltips, layer control, and Power BI cross-filtering. Use when the user
  mentions Leaflet, WMS, GeoJSON, shapefile, TileLayer, pbiviz, or this map visual.
---

# Leaflet Power BI maps

Use Leaflet **1.9.4** as documented in [the API reference](https://leafletjs.com/reference.html) and [tutorials](https://leafletjs.com/examples.html).

## Stack

- Power BI visual: `src/visual.ts` + `src/leafletMap.ts` + `src/settings.ts` + `capabilities.json`
- Leaflet factories: `L.map`, `L.tileLayer`, `L.tileLayer.wms`, `L.geoJSON`, `L.circleMarker`, `L.featureGroup`, `L.imageOverlay`, `L.control.layers`, `L.control.scale`
- Shapefiles: `shpjs` converts `.zip` / `.shp` ArrayBuffer to WGS84 GeoJSON, then `L.geoJSON`

## Rules

1. Keep the `L.Map` instance across updates. Call `invalidateSize({ animate: false })` on resize. Call `map.remove()` only in `destroy()`.
2. Never `bindPopup` / `bindTooltip` with unsanitized HTML from data. Build a DOM node and set `textContent`.
3. Use `L.circleMarker` for points (pixel radius). Do not rely on `L.Icon.Default` image paths inside the Power BI sandbox.
4. WMS must use `L.tileLayer.wms(baseUrl, { layers, styles, format, transparent, version, uppercase, opacity })`. Extra undocumented options are sent as vendor WMS parameters via `setParams`.
5. GeoJSON must use `pointToLayer`, `style`, `onEachFeature`, `filter` as needed. Hover uses `setStyle` + `resetStyle`. Click uses `fitBounds` and `ISelectionManager.select`.
6. Declare `WebAccess` in `capabilities.json` for every tile/WMS/GeoJSON/shapefile origin. Power BI CSP blocks tiles without it.
7. Match formatting model slice `name` values 1:1 with `capabilities.json` object properties.
8. Prefer `FeatureGroup.getBounds()` + `map.fitBounds(bounds, { padding, maxZoom })` over hard-coded zooms when Fit to data is on.
9. TMS services need `tms: true` or `{-y}` in the URL template.
10. Default CRS is `L.CRS.EPSG3857`. Switch to `L.CRS.EPSG4326` only when the WMS cannot serve Web Mercator.

## Workflow

1. Change `capabilities.json` and `src/settings.ts` together.
2. Put Leaflet behavior in `src/leafletMap.ts`, data parsing in `src/dataView.ts`, remote loaders in `src/layerLoaders.ts`.
3. Verify with `preview/index.html` for layer behavior, then `npx pbiviz start` or `npx pbiviz package`.
4. After TypeScript edits, check that `src/visual.ts` still imports every module (tsconfig only compiles that entry).

## Additional resources

- Leaflet API condensed for this visual: [reference.md](reference.md)
- Project README: [../../../README.md](../../../README.md)
