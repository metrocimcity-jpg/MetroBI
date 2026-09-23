---
name: d3-zoomable-sunburst
description: >-
  Builds and extends the MetroD3 Power BI visual: D3 7 zoomable sunburst from
  Observable @d3/zoomable-sunburst. Use when the user mentions MetroD3, D3,
  sunburst, partition, flare, or zoomable hierarchy rings.
---

# MetroD3 zoomable sunburst

The visual lives in `MetroD3/`. Read [MetroD3/README.md](../../../README.md) first.

- Chart: `MetroD3/src/sunburst.ts` (Observable partition + zoom)
- Tree from fields: `MetroD3/src/dataView.ts`
- Format persist: `settings.ts` + `format.ts` + `formattingModel.ts`
- Run `npx pbiviz package` from `MetroD3/`

Landing page shows the flare sample with no data. Format pane must persist without fields (`supportsEmptyDataView`, `selector: null`).
