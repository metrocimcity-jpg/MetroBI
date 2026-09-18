# Leaflet 1.9.4 APIs used by the MetroBI visual

Source: [Leaflet API reference](https://leafletjs.com/reference.html)

## Map

Create with `L.map(htmlElement, options)`.

Important options: `center`, `zoom`, `minZoom`, `maxZoom`, `zoomSnap`, `zoomDelta`, `crs`, `preferCanvas`, `dragging`, `scrollWheelZoom`, `doubleClickZoom`, `boxZoom`, `keyboard`, `worldCopyJump`, `zoomControl`, `attributionControl`.

State methods: `setView`, `setZoom`, `fitBounds`, `fitWorld`, `flyTo`, `flyToBounds`, `invalidateSize`, `setMinZoom`, `setMaxZoom`, `remove`.

Read methods: `getCenter`, `getZoom`, `getBounds`, `getContainer`.

Events used: `click`, `moveend`, `zoomend`, `baselayerchange`, `overlayadd`.

## Raster

- `L.tileLayer(urlTemplate, { attribution, maxZoom, opacity, tms, zIndex })`
- `L.tileLayer.wms(baseUrl, { layers, styles, format, transparent, version, crs, uppercase, opacity })` then `setParams`, `setOpacity`, `setZIndex`
- `L.imageOverlay(url, latLngBounds, { opacity, alt, interactive, errorOverlayUrl })`

WMS `layers` is required and is a **WMS layer name**, not a Leaflet layer. Comma-separated names are composed by the server in one image.

## Vector

- `L.circleMarker(latlng, { radius, color, weight, fillColor, fillOpacity })` — radius in **pixels**
- `L.geoJSON(data, { style, pointToLayer, onEachFeature, filter })` with `addData`, `resetStyle`, `setStyle`, `getBounds`
- `L.featureGroup(layers)` with `clearLayers`, `eachLayer`, `getBounds`, event bubbling

Path style: `stroke`, `color`, `weight`, `opacity`, `fill`, `fillColor`, `fillOpacity`, `dashArray`.

## UI

- `layer.bindPopup(htmlElement)` / `bindTooltip(htmlElement, { sticky, direction })`
- `L.control.layers(baseMaps, overlayMaps, { collapsed, position })`
- `L.control.scale()`
- Marker / circle `alt` or tooltip text for accessibility

## Coordinates

Leaflet methods take `[lat, lng]`. GeoJSON coordinates are `[lng, lat]`. `L.GeoJSON` converts them with `coordsToLatLng`.

Shapefiles are not native Leaflet layers. Parse to GeoJSON (WGS84) first.
