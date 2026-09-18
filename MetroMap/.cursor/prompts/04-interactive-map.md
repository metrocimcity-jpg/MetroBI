# Cursor prompt: interactive map and Power BI cross-filter

Use Leaflet Map interaction options and Layer events from https://leafletjs.com/reference.html#map.

Keep these behaviors in `MetroMap/src/leafletMap.ts` and `MetroMap/src/settings.ts`:

- Map handlers: `dragging`, `scrollWheelZoom`, `doubleClickZoom`, `boxZoom`, `keyboard` — enable/disable at runtime via `handler.enable()` / `handler.disable()`.
- Controls: `L.control.zoom` (map option `zoomControl`), `L.control.scale()`, `L.control.layers(baseMaps, overlayMaps)`.
- Points are `L.circleMarker` in a `L.featureGroup`. Click calls `selectionManager.select(identity, ctrlKey)` after `L.DomEvent.stopPropagation`.
- Empty map click clears the Power BI selection.
- Accessibility: unique tooltip/popup text per feature; keep keyboard navigation on unless the user disables it.
- `fitToData` uses `featureGroup.getBounds()` then `map.fitBounds`. If off, `setView(center, zoom)` from the Map card.
- Resize-only Power BI updates must not rebuild layers; they only call `invalidateSize`.

When adding a new interactive overlay, wire `click`, `mouseover`, and `mouseout` on the layer, not on the map, so `L.control.layers` and panning keep working.
