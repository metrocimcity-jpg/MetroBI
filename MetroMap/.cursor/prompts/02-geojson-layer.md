# Cursor prompt: GeoJSON interaction

Use Leaflet 1.9.4 `L.geoJSON` as documented at https://leafletjs.com/reference.html#geojson and the GeoJSON tutorial.

Update `MetroMap/src/leafletMap.ts` so GeoJSON from the **field well** and from the **Format pane URL** share one helper.

The Format pane URL (`geojson.url`) must persist with no fields bound — follow [00-format-pane.md](00-format-pane.md). Remote GeoJSON needs CORS and `WebAccess` (including localhost if the file is served locally).

Requirements:

- `pointToLayer(feature, latlng)` must return `L.circleMarker`, not `L.marker`.
- `style(feature)` must use Path options: `color`, `weight`, `fillColor`, `fillOpacity`.
- When choropleth is on, color from the Color by measure or from `feature.properties.density` / `value`.
- `onEachFeature` binds popup and tooltip via DOM `textContent` (never HTML strings from properties).
- Hover: `setStyle({ weight, color: '#333' })` then `bringToFront()`; mouseout: `geoJson.resetStyle(layer)`.
- Click: `map.fitBounds(layer.getBounds(), { padding: [24, 24], maxZoom: 14 })` and Power BI `selectionManager.select`.
- Keep `addData` available so row-level GeoJSON can stream into one FeatureGroup.
- Coordinates in GeoJSON are `[lng, lat]`; do not swap them manually — `L.geoJSON` already converts with `coordsToLatLng`.
- Do not block `renderingFinished` on the remote fetch; load asynchronously and show status on failure.
