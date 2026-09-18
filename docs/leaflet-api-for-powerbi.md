# Leaflet 1.9.4 → Power BI visual mapping

Official docs:

- Tutorials: [leafletjs.com/examples.html](https://leafletjs.com/examples.html)
- API reference: [leafletjs.com/reference.html](https://leafletjs.com/reference.html)

## Tutorial → visual

| Tutorial | Leaflet API | Visual behavior |
| --- | --- | --- |
| Quick start | `L.map`, `L.tileLayer`, `L.circle`, `bindPopup`, `map.on('click')` | Map host, OSM basemap, CircleMarker points, popups |
| Mobile | 100% height, `locate` | Visual fills the Power BI viewport; geolocation is off in the sandbox by default |
| Custom icons | `L.icon`, `L.Icon.extend` | CircleMarkers avoid default icon URLs in the pbiviz bundle |
| Accessible maps | `alt` / `title`, keyboard | Keyboard handler stays on; popup text is unique per feature |
| GeoJSON | `L.geoJSON` `style`, `pointToLayer`, `onEachFeature`, `filter` | Data-role GeoJSON + URL GeoJSON |
| Choropleth | `getColor`, `resetStyle`, info/legend controls | Color by measure, hover highlight |
| Layer groups | `L.layerGroup`, `L.control.layers` | Basemap / WMS / GeoJSON / shapefile / points |
| Zoom levels | `zoomSnap`, `fitBounds`, `setZoom` | Map format card |
| CRS.Simple | `L.CRS.Simple` | Not default; geographic CRS only (3857 / 4326) |
| WMS and TMS | `L.tileLayer.wms`, `tms: true` | WMS card + basemap TMS toggle |
| Map panes | `createPane`, z-index | Default panes; WMS `setZIndex` |
| Overlays | `L.imageOverlay` | Image overlay card |

## API classes wired in code

`Map`, `TileLayer`, `TileLayer.WMS`, `ImageOverlay`, `CircleMarker`, `Path`, `GeoJSON`, `FeatureGroup`, `LayerGroup`, `Control.Layers`, `Control.Scale`, `LatLngBounds`, `Evented`.
