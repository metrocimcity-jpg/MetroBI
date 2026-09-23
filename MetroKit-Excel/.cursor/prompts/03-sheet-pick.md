# Cursor prompt: pick → sheet and highlight from cells

Picking lives in `MetroKit-Excel/src/viewer.ts`. Excel I/O is `src/excel.ts`.

- `cameraControl` `picked` / `pickedNothing`. Highlight the entity; optional X-ray of the rest (`appearance.xrayOthers`).
- Overlay name/type from `metaScene.metaObjects`.
- When **Write pick to sheet** is on and Excel is the host, write `[id, name, type]` to the selected range.
- **Highlight IDs from selection** reads every non-empty selected cell and calls `setSheetHighlight`.
- **From cell** reads the first selected cell as a model URL.
- Guard with `isExcelHost()`. Preview in the browser must still render the model.
