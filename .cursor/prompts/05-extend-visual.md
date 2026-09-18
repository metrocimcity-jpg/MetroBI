# Cursor prompt: add a Leaflet overlay to the Power BI visual

You are extending MetroBI's Leaflet Power BI visual.

Read `.cursor/skills/leaflet-powerbi-maps/SKILL.md` and `src/leafletMap.ts` first.

Then add the overlay the user names (WMS, GeoJSON, shapefile, image, video, or TMS) using only Leaflet 1.9.4 factories from https://leafletjs.com/reference.html.

Checklist:

- [ ] Format card in `src/settings.ts`
- [ ] Matching properties in `capabilities.json`
- [ ] Create/destroy the Leaflet layer inside `LeafletMapController.render`
- [ ] Register in `L.control.layers` if it can be toggled
- [ ] `WebAccess` privilege if it fetches a URL
- [ ] Safe popup/tooltip DOM
- [ ] `invalidateSize` still runs after add
- [ ] Preview or README note for how to bind the layer in Power BI

Do not introduce Mapbox GL, OpenLayers, or a second map instance.
