# Cursor prompt: Format pane persistence (MetroMap)

WMS, GeoJSON URL, shapefile URL, image overlay, basemap, and toggles must work **with no fields bound**. Copy MetroKit’s pattern.

## Required capabilities

In `MetroMap/capabilities.json`:

- `supportsLandingPage: true`
- `supportsEmptyDataView: true` — Power BI only sends Format objects when there are no data roles if this is on
- `dataViewMappings.conditions` includes an empty `{}` plus the field-well condition
- `WebAccess` includes `https://*`, `http://*`, **and** explicit `http://localhost`, `http://localhost:*`, `http://127.0.0.1`, `http://127.0.0.1:*` (`http://*` does **not** cover localhost)

Power BI’s Format pane **cannot** host a file picker. Layers are URLs (or field wells), never Browse.

## Required code

- `MetroMap/src/settings.ts` — after constructing cards, `bindUnboundSelectors` so every slice has `selector: null`
- `MetroMap/src/formattingModel.ts` — `forceNullSelectors` on the model returned by `getFormattingModel`
- `MetroMap/src/format.ts` — `applyFormattingObjects` / `enumerateObjectCard` (`selector: null`). Do **not** rely on `populateFormattingSettingsModel` alone: its `getPropertyValue` treats `{ value: T }` as “use default”, so toggles and URLs snap back
- `MetroMap/src/visual.ts` — keep in-memory settings when `metadata.objects` is empty; apply objects when present; treat `VisualUpdateType.Style` as a format update, not resize-only; call `renderingFinished` immediately (do not wait on GeoJSON/shapefile fetch)

## Authoring UX

- URL / text boxes commit on **Enter** or click-outside
- Pair every slice `name` with `capabilities.json` object properties (case-sensitive)
- Hosts must send CORS headers
