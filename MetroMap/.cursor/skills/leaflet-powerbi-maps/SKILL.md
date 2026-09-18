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

- Power BI visual: `MetroMap/src/visual.ts` + `leafletMap.ts` + `settings.ts` + `format.ts` + `formattingModel.ts` + `capabilities.json`
- Leaflet factories: `L.map`, `L.tileLayer`, `L.tileLayer.wms`, `L.geoJSON`, `L.circleMarker`, `L.featureGroup`, `L.imageOverlay`, `L.control.layers`, `L.control.scale`
- Shapefiles: Format pane URL → `shpjs` ArrayBuffer → WGS84 GeoJSON → `L.geoJSON` (not a field well)

## Rules

1. Keep the `L.Map` instance across updates. Call `invalidateSize({ animate: false })` on resize. Call `map.remove()` only in `destroy()`.
2. Never `bindPopup` / `bindTooltip` with unsanitized HTML from data. Build a DOM node and set `textContent`.
3. Use `L.circleMarker` for points (pixel radius). Do not rely on `L.Icon.Default` image paths inside the Power BI sandbox.
4. WMS must use `L.tileLayer.wms(baseUrl, { layers, styles, format, transparent, version, uppercase, opacity })`. Extra undocumented options are sent as vendor WMS parameters via `setParams`.
5. GeoJSON must use `pointToLayer`, `style`, `onEachFeature`, `filter` as needed. Hover uses `setStyle` + `resetStyle`. Click uses `fitBounds` and `ISelectionManager.select`.
6. Declare `WebAccess` for every tile/WMS/GeoJSON/shapefile origin. Include explicit localhost / 127.0.0.1; `http://*` does not cover localhost.
7. Match formatting model slice `name` values 1:1 with `capabilities.json` object properties. Bind `selector: null` (`bindUnboundSelectors`). Persist with `supportsEmptyDataView`, empty `{}` mapping condition, `forceNullSelectors`, and `applyFormattingObjects`. Do not use `populateFormattingSettingsModel` as the only reader.
8. Prefer `FeatureGroup.getBounds()` + `map.fitBounds(bounds, { padding, maxZoom })` over hard-coded zooms when Fit to data is on.
9. TMS services need `tms: true` or `{-y}` in the URL template.
10. Default CRS is `L.CRS.EPSG3857`. Switch to `L.CRS.EPSG4326` only when the WMS cannot serve Web Mercator.
11. Format pane Style updates are not resize-only. Call `renderingFinished` immediately; do not wait on remote layer fetch.
12. Do not use `tile.openstreetmap.org` (403 in Power BI). Default Esri/Carto. No Format-pane file picker.

## Workflow

1. Change `MetroMap/capabilities.json` and `MetroMap/src/settings.ts` together.
2. Put Leaflet behavior in `MetroMap/src/leafletMap.ts`, data parsing in `dataView.ts`, remote loaders in `layerLoaders.ts`, Format persist in `format.ts` / `formattingModel.ts`.
3. Verify with `MetroMap/preview/index.html` for layer behavior, then from `MetroMap/` run `npx pbiviz package`.
4. After TypeScript edits, check that `MetroMap/src/visual.ts` still imports every module (tsconfig only compiles that entry).

## Prompts

Attach files in `MetroMap/.cursor/prompts/` (start with `00-format-pane.md` for URL/toggle persist).

## Additional resources

- Leaflet API condensed for this visual: [reference.md](reference.md)
- Visual README: [../../../README.md](../../../README.md)
