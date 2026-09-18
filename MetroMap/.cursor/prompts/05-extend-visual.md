# Cursor prompt: add a Leaflet overlay to the Power BI visual

You are extending MetroMap, the Leaflet Power BI visual in `MetroMap/`.

Read `MetroMap/.cursor/skills/leaflet-powerbi-maps/SKILL.md`, [00-format-pane.md](00-format-pane.md), and `MetroMap/src/leafletMap.ts` first.

Then add the overlay the user names (WMS, GeoJSON, shapefile, image, video, or TMS) using only Leaflet 1.9.4 factories from https://leafletjs.com/reference.html.

Checklist:

- [ ] Format card in `MetroMap/src/settings.ts` (slice names match capabilities; `bindUnboundSelectors` still covers new slices)
- [ ] Matching properties in `MetroMap/capabilities.json`
- [ ] Create/destroy the Leaflet layer inside `LeafletMapController.render`
- [ ] Register in `L.control.layers` if it can be toggled
- [ ] `WebAccess` privilege if it fetches a URL (add localhost entries if users will load from WAMP/`http://localhost`)
- [ ] Safe popup/tooltip DOM
- [ ] `invalidateSize` still runs after add
- [ ] `renderingFinished` is not delayed on remote fetch
- [ ] README note: Format pane URL (not a field well) unless the user asked for a data role; press Enter to commit text boxes

Do not introduce Mapbox GL, OpenLayers, or a second map instance. Do not add a file picker to the Format pane (Power BI cannot host one).
