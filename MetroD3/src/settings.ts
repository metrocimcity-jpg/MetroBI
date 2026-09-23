"use strict";

import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;
import Slice = formattingSettings.Slice;

const UNBOUND_SELECTOR = null as unknown as powerbi.data.Selector;

function bindUnboundSelectors(cards: Card[]): void {
    for (const card of cards) {
        for (const slice of card.slices || []) {
            (slice as formattingSettings.SimpleSlice).selector = UNBOUND_SELECTOR;
        }
    }
}

class ChartCard extends Card {
    duration = new formattingSettings.NumUpDown({
        name: "duration",
        displayName: "Zoom duration (ms)",
        value: 750
    });
    showLabels = new formattingSettings.ToggleSwitch({
        name: "showLabels",
        displayName: "Show labels",
        value: true
    });

    name = "chart";
    displayName = "Chart";
    slices: Slice[] = [this.duration, this.showLabels];
}

class AppearanceCard extends Card {
    background = new formattingSettings.ColorPicker({
        name: "background",
        displayName: "Background",
        value: { value: "#ffffff" }
    });
    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font size",
        value: 10
    });
    colorScheme = new formattingSettings.AutoDropdown({
        name: "colorScheme",
        displayName: "Color scheme",
        value: "rainbow"
    });

    name = "appearance";
    displayName = "Appearance";
    slices: Slice[] = [this.background, this.fontSize, this.colorScheme];
}

class SelectionCard extends Card {
    crossFilter = new formattingSettings.ToggleSwitch({
        name: "crossFilter",
        displayName: "Cross-filter on click",
        value: true
    });

    name = "selection";
    displayName = "Selection";
    slices: Slice[] = [this.crossFilter];
}

class DataCard extends Card {
    jsonUrl = new formattingSettings.TextInput({
        name: "jsonUrl",
        displayName: "Hierarchy JSON URL",
        value: "",
        placeholder: "https://example.com/flare.json"
    });

    name = "data";
    displayName = "Data URL";
    slices: Slice[] = [this.jsonUrl];
}

export class VisualFormattingSettingsModel extends Model {
    chart = new ChartCard();
    appearance = new AppearanceCard();
    selection = new SelectionCard();
    data = new DataCard();

    cards = [this.chart, this.appearance, this.selection, this.data];

    constructor() {
        super();
        bindUnboundSelectors(this.cards);
    }
}
