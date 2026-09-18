# Cursor prompt: GeoJSON interaction

Use Leaflet 1.9.4 `L.geoJSON` as documented at https://leafletjs.com/reference.html#geojson and the GeoJSON tutorial.

Update `src/leafletMap.ts` so GeoJSON from the data role and from the format-pane URL share one helper.

Requirements:

- `pointToLayer(feature, latlng)` must return `L.circleMarker`, not `L.marker`.
- `style(feature)` must use Path options: `color`, `weight`, `fillColor`, `fillOpacity`.
- When choropleth is on, color from the Color by measure or from `feature.properties.density` / `value`.
- `onEachFeature` binds popup and tooltip via DOM `textContent` (never HTML strings from properties).
- Hover: `setStyle({ weight, color: '#333' })` then `bringToFront()`; mouseout: `geoJson.resetStyle(layer)`.
- Click: `map.fitBounds(layer.getBounds(), { padding: [24, 24], maxZoom: 14 })` and Power BI `selectionManager.select`.
- Keep `addData` available so row-level GeoJSON can stream into one FeatureGroup.
- Coordinates in GeoJSON are `[lng, lat]`; do not swap them manually — `L.geoJSON` already converts with `coordsToLatLng`.
