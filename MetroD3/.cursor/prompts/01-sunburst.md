# Cursor prompt: D3 zoomable sunburst

Keep the chart aligned with https://observablehq.com/@d3/zoomable-sunburst (D3 7 `hierarchy` + `partition` + `arc`).

Implementation: `MetroD3/src/sunburst.ts`.

- `d3.partition().size([2 * Math.PI, height + 1])`
- Show two rings (`arcVisible`: `y1 <= 3 && y0 >= 1`)
- Click a node with children to zoom; click the center circle to zoom out
- Color by first-level ancestor (`while (depth > 1) parent`)
- Labels use `labelTransform` rotate/translate
- Power BI Category columns become a `{ name, children, value }` tree in `dataView.ts`
- Landing page uses `SAMPLE_FLARE` when no fields and no JSON URL
- Cross-filter descendant `ISelectionId`s when Format → Selection is on
- Do not replace D3 with another chart library
