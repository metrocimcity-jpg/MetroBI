# Cursor prompt: Format pane persistence (MetroD3)

Chart, appearance, selection, and Data URL must persist **with no fields bound**. Same contract as MetroMap / MetroKit.

- `supportsLandingPage` + `supportsEmptyDataView`
- empty `{}` dataView condition
- slice `selector: null` (`bindUnboundSelectors`)
- `forceNullSelectors` in `getFormattingModel`
- `applyFormattingObjects` (do not use `populateFormattingSettingsModel` alone)
- `renderingFinished` immediately; JSON fetch is async
- `WebAccess` lists localhost explicitly if users load JSON from WAMP
- No file picker in the Format pane. Press Enter to commit the JSON URL.
