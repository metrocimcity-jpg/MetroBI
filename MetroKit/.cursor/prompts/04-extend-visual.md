# Cursor prompt: extend the MetroKit xeokit visual

You are extending MetroKit in `MetroKit/`.

Read `.cursor/skills/xeokit-metrokit/SKILL.md`, [MetroKit/README.md](../../README.md), and [00-format-pane.md](00-format-pane.md) first.

Checklist:

- [ ] Format slice in `MetroKit/src/settings.ts` with `selector: null` (`unboundSlice`)
- [ ] Matching property in `MetroKit/capabilities.json`
- [ ] Apply the setting in `XeokitViewerController` (camera/appearance immediately; loader flags via load signature)
- [ ] `getFormattingModel` still runs `forceNullSelectors`
- [ ] `applyFormattingObjects` still maps the new slice
- [ ] `supportsLandingPage` and `supportsEmptyDataView` stay true
- [ ] `WebAccess` covers the host (localhost explicitly if needed)
- [ ] `renderingFinished` is not tied to model fetch
- [ ] Package from `MetroKit/` with `npm run package` (webpack `fs`/`path` stay false via `scripts/patch-pbiviz-webpack.cjs`)
- [ ] IFC WASM stays on `https://localhost:8091/web-ifc/` via `npm run preview:https` ([05-ifc-chart.md](05-ifc-chart.md))
- [ ] Chart highlight stays in `resolveChartHighlight`; `supportsHighlight` stays false

Do not add a Format-pane file picker or restore the removed local-file sidebar unless the user asks. xeokit is AGPL-3.0.
