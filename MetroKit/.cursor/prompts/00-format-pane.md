# Cursor prompt: Format pane persistence (MetroKit)

Model URL and all on/off Format controls must work **with no Object ID / fields bound**. The 3D canvas is a landing page (`supportsLandingPage`).

## Required capabilities

In `MetroKit/capabilities.json`:

- `supportsLandingPage: true` — turning this off shows Power BI’s empty “need data” placeholder and hides xeokit
- `supportsEmptyDataView: true` — without this, Format pane URL/toggles do nothing because `metadata.objects` never arrives
- `dataViewMappings.conditions` includes an empty `{}` plus the field-well condition
- `WebAccess` includes `https://*`, `http://*`, **and** explicit localhost / 127.0.0.1 (with and without `:80` / `:*`). `http://*` does **not** include localhost

Power BI’s Format pane **cannot** host a file picker. Do not add an in-visual Browse sidebar unless the user asks. Models load from **Format → Model → Model URL**.

## Required code

- `MetroKit/src/settings.ts` — `unboundSlice` / `selector: null` on every slice; default Model URL may be `http://localhost/metrobi/1.xkt`
- `MetroKit/src/formattingModel.ts` — `forceNullSelectors` in `getFormattingModel`
- `MetroKit/src/format.ts` — unwrap `{ value }`, `{ expr.literal.value }`, and Fill `{ solid.color }`; `applyFormattingObjects`; `enumerateObjectCard` with `selector: null`. Skip `populateFormattingSettingsModel` as the only reader — it resets wrapped bools/strings to defaults
- `MetroKit/src/visual.ts` — keep in-memory settings when objects are missing; apply objects when present; `Style` is not resize-only; `renderingFinished` immediately (never wait on a 50MB XKT fetch; never `renderingFailed` for a load error — show canvas status instead)

## Authoring UX

- After changing Model URL, press **Enter** or click outside the box
- Apache/WAMP must send `Access-Control-Allow-Origin` for the model host
- Fetch the file as `ArrayBuffer` and pass `xkt` / `gltf` / `ifc` into the loader — `src: url` often fails CORS inside Power BI
