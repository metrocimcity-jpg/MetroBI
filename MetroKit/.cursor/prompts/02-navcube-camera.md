# Cursor prompt: camera and NavCube

Keep orbit navigation and the 3D cube in `MetroKit/src/xeokitViewer.ts`. Format cards: `camera`, `navCube` — persist with no data ([00-format-pane.md](00-format-pane.md)).

- One `Viewer` on the main canvas; **NavCubePlugin** on a **separate** `canvasElement` (never the viewer canvas).
- Camera: `navMode` orbit / firstPerson / planView; projection perspective / ortho; `doublePickFlyTo`, `followPointer`, pivot, `fitOnLoad` via `cameraFlight.jumpTo({ aabb, fit: true })`.
- Cube: show/hide, size in px, corner alignment (top/bottom + Left/Right), `cameraFly`.
- Toggling **Show 3D cube** must hide the overlay immediately on a Style update without reloading the model.
- Edges / SAO changes may reload the model (they are part of the load signature).
