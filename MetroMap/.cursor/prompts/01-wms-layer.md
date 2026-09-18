# Cursor prompt: extend WMS support

Use the Leaflet 1.9.4 skill and [API reference](https://leafletjs.com/reference.html#tilelayer-wms).

Extend the MetroMap WMS layer in `MetroMap/src/leafletMap.ts` and `MetroMap/src/settings.ts`.

WMS is a **Format pane** card (`wms`), not a field well. It must persist with no data bound — follow [00-format-pane.md](00-format-pane.md).

Requirements:

- Create layers with `L.tileLayer.wms(baseUrl, options)`, never by concatenating GetMap query strings by hand.
- Required option: `layers` (comma-separated WMS layer names). Document the name the user types; Leaflet has no GetCapabilities parser.
- Expose `styles`, `format` (default `image/png`), `transparent`, `version` (default `1.1.1`), `uppercase`, `opacity`, `show`, `asBasemap`.
- Extra vendor parameters go through `wmsLayer.setParams(params)`.
- If the service is not Web Mercator, set map `crs` to `L.CRS.EPSG4326` and keep WMS `crs` null so it inherits the map CRS.
- Register in `L.control.layers` as a base layer when "Use as base layer" is on, otherwise as an overlay.
- Add the WMS origin to `MetroMap/capabilities.json` `privileges.WebAccess.parameters` if it is not already covered. Localhost WMS needs the explicit localhost entries, not only `http://*`.
- After Power BI resizes the visual, call `map.invalidateSize({ animate: false })` and `wmsLayer.redraw()` if tiles look stale.
- Toggling **Show WMS** must apply on `VisualUpdateType.Style` without rebuilding the whole map from defaults.
