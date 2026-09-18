# Cursor prompt: pick, highlight, and cross-filter

Object picking lives in `MetroKit/src/xeokitViewer.ts` and `MetroKit/src/dataView.ts`.

- `cameraControl` `picked` / `pickedNothing`. Highlight the entity; optional X-ray of the rest (`appearance.xrayOthers`).
- Overlay name/type from `metaScene.metaObjects`.
- Cross-filter only when Format → Selection → Cross-filter is on **and** the picked id exists in the Object ID field well (`selectionManager.select`). With no data bound, pick still highlights in the viewer.
- Respect `hostCapabilities.allowInteractions`.
- Object ID / Label / Color by / Tooltips are optional field wells. The visual must render the model from Format → Model URL without them.
