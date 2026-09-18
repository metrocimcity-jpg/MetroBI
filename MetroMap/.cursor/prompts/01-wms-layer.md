# Cursor prompt: extend WMS support

Use the Leaflet 1.9.4 skill and [API reference](https://leafletjs.com/reference.html#tilelayer-wms).

Extend the MetroBI Power BI visual WMS layer in `MetroMap/src/leafletMap.ts` and `MetroMap/src/settings.ts`.

Requirements:

- Create layers with `L.tileLayer.wms(baseUrl, options)`, never by concatenating GetMap query strings by hand.
- Required option: `layers` (comma-separated WMS layer names).
- Expose `styles`, `format` (default `image/png`), `transparent`, `version` (default `1.1.1`), `uppercase`, `opacity`.
- Any extra vendor parameters must go through `wmsLayer.setParams(params)`.
- If the service is not Web Mercator, set map `crs` to `L.CRS.EPSG4326` and keep WMS `crs` null so it inherits the map CRS.
- Register the layer in `L.control.layers` as a base layer when "Use as base layer" is on, otherwise as an overlay.
- Add the WMS origin to `MetroMap/capabilities.json` `privileges.WebAccess.parameters` if it is not already covered by `https://*`.
- After Power BI resizes the visual, call `map.invalidateSize({ animate: false })` and `wmsLayer.redraw()` if tiles look stale.

Do not use Leaflet `GetCapabilities` parsing; Leaflet does not support it. Document the layer name the user must type.
