# MetroBI Leaflet Interactive Map

Power BI custom visual built on [Leaflet 1.9.4](https://leafletjs.com/reference.html). It is an interactive map that can show Power BI lat/lng points together with **WMS**, **GeoJSON**, and **shapefile** overlays.

Leaflet sources used while building this visual:

- Tutorials: [leafletjs.com/examples.html](https://leafletjs.com/examples.html)
- API reference: [leafletjs.com/reference.html](https://leafletjs.com/reference.html)

## What the visual can do

- **Interactive map** — pan, wheel zoom, double-click zoom, shift-box zoom, keyboard arrows, scale bar, and a layers control (`L.control.layers`).
- **Basemaps** — Esri World Street (default), Esri Topo, Esri Imagery, Carto Voyager/Positron/Dark, or none (WMS-only). `tile.openstreetmap.org` is not used: OSM’s public tile servers return **403 Access blocked** inside Power BI.
- **WMS** — `L.tileLayer.wms` with `layers`, `styles`, `format`, `transparent`, `version`, `uppercase`, and opacity. Optional use as a base layer.
- **GeoJSON** — URL or a GeoJSON text column. Uses `style`, `pointToLayer` (circle markers), `onEachFeature`, hover `resetStyle`, and click `fitBounds`.
- **Shapefile** — URL to a `.zip` (shp + dbf + prj) or `.shp`. Parsed with `shpjs` to WGS84 GeoJSON, then drawn with the same GeoJSON path.
- **Points** — Latitude / Longitude columns as `L.circleMarker`. Size and Color by measures. Popups and tooltips use DOM `textContent` (no HTML injection).
- **Image overlay** — `L.imageOverlay` with north/south/east/west bounds.
- **Power BI** — cross-filter on click, highlight support, format pane cards, `WebAccess` so tiles and layer URLs can load.

Shapefiles are not a Leaflet class. Leaflet only understands GeoJSON vectors and raster tiles. The visual converts shapefiles first, which is the supported path.

## Power BI fields

| Field well | Role |
| --- | --- |
| Category | Label for popups, tooltips, and selection |
| Latitude / Longitude | Point markers |
| Size | CircleMarker radius |
| Color by | Choropleth / point color |
| GeoJSON | Feature or FeatureCollection text per row |
| Tooltips | Extra popup rows |

WMS, shapefile, GeoJSON URL, and image overlay are format-pane URLs, not field wells. Layer hosts must send CORS headers. Power BI blocks the request without the visual's `WebAccess` privilege.

## Format pane

- **Map** — center, zoom, min/max zoom, zoom snap/delta, fit to data, canvas renderer, CRS (`EPSG:3857` or `EPSG:4326`)
- **Interaction** — drag, wheel, double-click, box zoom, keyboard, zoom/scale/layers controls, cross-filter
- **Basemap** — provider, opacity, TMS Y-axis
- **WMS layer** — URL, layer names, style, format, transparency, version
- **GeoJSON layer** — URL, path style, hover highlight, zoom on click, choropleth
- **Shapefile layer** — URL, path style
- **Point markers** — radius, color, fill opacity
- **Image overlay** — URL and geographic bounds

## Develop

Prerequisites: Node.js 18+ and [Power BI developer mode](https://learn.microsoft.com/en-us/power-bi/developer/visuals/environment-setup).

```powershell
cd MetroMap
npm install
npx pbiviz start
```

In Power BI Desktop: File → Options → Report settings → **Develop a visual**. Add the visual from `https://localhost:8080/`.

```powershell
cd MetroMap
npx pbiviz package
```

The `.pbiviz` file lands in `MetroMap/dist/`. Import it with **Import a visual from a file**.

Leaflet layer behavior without Power BI:

```powershell
# open preview/index.html in a browser
```

That preview loads OSM, a Mundialis WMS hillshade, `preview/sample.geojson`, and an optional shapefile zip from a file input.

Sample point data for Power BI is in `docs/sample-points.csv`.

## Cursor prompts

Attach any file in `.cursor/prompts/` (from the repo, `MetroMap/.cursor/prompts/`) to a Cursor chat when you want the agent to extend one capability:

| Prompt | Use when |
| --- | --- |
| [01-wms-layer.md](.cursor/prompts/01-wms-layer.md) | WMS / TMS / `setParams` |
| [02-geojson-layer.md](.cursor/prompts/02-geojson-layer.md) | GeoJSON style, hover, choropleth |
| [03-shapefile-layer.md](.cursor/prompts/03-shapefile-layer.md) | shpjs → GeoJSON pipeline |
| [04-interactive-map.md](.cursor/prompts/04-interactive-map.md) | handlers, controls, cross-filter |
| [05-extend-visual.md](.cursor/prompts/05-extend-visual.md) | add a new overlay type |

Project skill: `.cursor/skills/leaflet-powerbi-maps/`. Rule: `.cursor/rules/leaflet-powerbi-visual.mdc`. API mapping: [docs/leaflet-api-for-powerbi.md](docs/leaflet-api-for-powerbi.md).

## Architecture

```
src/visual.ts          Power BI IVisual, formatting model, resize vs data updates
src/settings.ts        Format pane cards (must match capabilities.json)
src/dataView.ts        Categorical field wells → rows and selection IDs
src/leafletMap.ts      L.Map lifecycle and all overlay factories
src/layerLoaders.ts    fetch GeoJSON / shapefile
src/safeDom.ts         popup and tooltip DOM
src/style.ts           choropleth colors and radius scale
```

The map instance is kept across updates. Resize-only updates call `invalidateSize`. `destroy()` calls `map.remove()`.

## Notes from the Leaflet API

- WMS `layers` is a **server** layer list, not a Leaflet `Layer` object.
- GeoJSON coordinates are `[lng, lat]`; Leaflet methods take `[lat, lng]`.
- `L.circleMarker` radius is pixels; `L.circle` radius is meters.
- Popup strings are HTML. This visual never passes dataset text straight into `bindPopup`.
- OpenStreetMap’s volunteer tile servers (`tile.openstreetmap.org`) block Power BI. The visual uses Esri or Carto tiles instead; OSM data attribution is still shown on Carto styles.

## License

MIT. Leaflet is © Volodymyr Agafonkin. Map tiles © their providers (OpenStreetMap, CARTO, Esri, Mundialis, and any WMS you configure).
