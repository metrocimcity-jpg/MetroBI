# MetroD3 — Zoomable sunburst

Power BI custom visual based on [Observable: Zoomable sunburst](https://observablehq.com/@d3/zoomable-sunburst) (Mike Bostock / D3).

Click a ring to zoom in (two layers at a time). Click the center to zoom out. Hold Alt for a slow zoom.

## Power BI fields

| Field well | Role |
| --- | --- |
| Category | Hierarchy levels, outermost first (bind several columns) |
| Value | Numeric size of each leaf |
| Tooltips | Extra hover rows |

With no fields, the visual shows the same **flare** sample as the Observable notebook. Or set **Format → Data URL** to a `{ name, value?, children? }` JSON file (CORS + `WebAccess`).

Sample columns: [docs/sample-hierarchy.csv](docs/sample-hierarchy.csv).

## Format pane

Settings persist with **no fields bound**. Press Enter to commit the JSON URL.

- **Chart** — zoom duration (ms), show labels
- **Appearance** — background, font size, color scheme (Rainbow / Tableau 10 / Category 10)
- **Selection** — cross-filter on click
- **Data URL** — optional hierarchy JSON

## Develop

```powershell
cd MetroD3
npm install
npx pbiviz package
```

Import `MetroD3/dist/zoomableSunburstMetroD3F4A8C2E1.1.0.0.0.pbiviz`. Look for **MetroD3 1.0.0.0** at the top-right.

Standalone preview (no Power BI): open `preview/index.html`.

## Cursor prompts

| Prompt | Use when |
| --- | --- |
| [00-format-pane.md](.cursor/prompts/00-format-pane.md) | Format pane persist without fields |
| [01-sunburst.md](.cursor/prompts/01-sunburst.md) | D3 partition / zoom / arcs |

Project skill: `.cursor/skills/d3-metro-d3/`. Rule: `.cursor/rules/metrod3-d3.mdc`.

## Architecture

```
src/visual.ts          Power BI IVisual, Format persist
src/settings.ts        Format pane cards
src/format.ts          Unwrap persisted objects
src/formattingModel.ts Null selectors
src/dataView.ts        Category columns → hierarchy tree
src/sunburst.ts        D3 partition + zoom (Observable chart)
src/sample.ts          Flare landing-page tree
```

## License

MIT. D3 is ISC. Chart behavior follows the Observable example (Copyright 2018–2024 Observable, Inc.; D3).
