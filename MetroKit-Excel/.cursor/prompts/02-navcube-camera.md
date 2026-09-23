# Cursor prompt: orbit camera and 3D cube (Excel)

Camera and NavCube live in `MetroKit-Excel/src/viewer.ts`.

- `cameraControl.navMode`: orbit / firstPerson / planView.
- Projection: perspective or ortho.
- `followPointer`, `doublePickFlyTo`, optional pivot at scene center.
- `fitOnLoad` uses `cameraFlight.jumpTo({ aabb, fit: true })`.
- NavCube is a **second canvas** (`cubeCanvas`), not the main viewer canvas. Size 80–320 px. Corner alignment via CSS. `setCameraFly` for fly vs jump.
