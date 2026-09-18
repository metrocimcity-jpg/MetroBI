"use strict";

import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;
import Slice = formattingSettings.Slice;

const UNBOUND_SELECTOR = null as unknown as powerbi.data.Selector;

function unboundSlice<T extends formattingSettings.SimpleSlice>(slice: T): T {
    slice.selector = UNBOUND_SELECTOR;
    return slice;
}

class ModelCard extends Card {
    url = unboundSlice(new formattingSettings.TextInput({
        name: "url",
        displayName: "Model URL",
        value: "http://localhost/metrobi/1.xkt",
        placeholder: "http://localhost/metrobi/1.xkt"
    }));
    format = unboundSlice(new formattingSettings.AutoDropdown({
        name: "format",
        displayName: "Format",
        value: "auto"
    }));
    edges = unboundSlice(new formattingSettings.ToggleSwitch({
        name: "edges",
        displayName: "Emphasis edges",
        value: true
    }));
    sao = unboundSlice(new formattingSettings.ToggleSwitch({
        name: "sao",
        displayName: "Ambient occlusion",
        value: true
    }));
    excludeSpaces = unboundSlice(new formattingSettings.ToggleSwitch({
        name: "excludeSpaces",
        displayName: "Hide IfcSpace",
        value: true
    }));

    name = "model";
    displayName = "Model";
    slices: Slice[] = [this.url, this.format, this.edges, this.sao, this.excludeSpaces];
}

class CameraCard extends Card {
    navMode = unboundSlice(new formattingSettings.AutoDropdown({
        name: "navMode",
        displayName: "Navigation",
        value: "orbit"
    }));
    projection = unboundSlice(new formattingSettings.AutoDropdown({
        name: "projection",
        displayName: "Projection",
        value: "perspective"
    }));
    fitOnLoad = unboundSlice(new formattingSettings.ToggleSwitch({
        name: "fitOnLoad",
        displayName: "Fit model on load",
        value: true
    }));
    doublePickFlyTo = unboundSlice(new formattingSettings.ToggleSwitch({
        name: "doublePickFlyTo",
        displayName: "Double-click fly to object",
        value: true
    }));
    followPointer = unboundSlice(new formattingSettings.ToggleSwitch({
        name: "followPointer",
        displayName: "Orbit around pointer",
        value: true
    }));
    pivot = unboundSlice(new formattingSettings.ToggleSwitch({
        name: "pivot",
        displayName: "Show pivot",
        value: true
    }));

    name = "camera";
    displayName = "Camera";
    slices: Slice[] = [
        this.navMode, this.projection, this.fitOnLoad,
        this.doublePickFlyTo, this.followPointer, this.pivot
    ];
}

class NavCubeCard extends Card {
    show = unboundSlice(new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show 3D cube",
        value: true
    }));
    size = unboundSlice(new formattingSettings.NumUpDown({
        name: "size",
        displayName: "Size (px)",
        value: 200
    }));
    alignment = unboundSlice(new formattingSettings.AutoDropdown({
        name: "alignment",
        displayName: "Position",
        value: "bottomRight"
    }));
    cameraFly = unboundSlice(new formattingSettings.ToggleSwitch({
        name: "cameraFly",
        displayName: "Fly to face",
        value: true
    }));

    name = "navCube";
    displayName = "3D cube";
    slices: Slice[] = [this.show, this.size, this.alignment, this.cameraFly];
}

class AppearanceCard extends Card {
    background = unboundSlice(new formattingSettings.ColorPicker({
        name: "background",
        displayName: "Background",
        value: { value: "#d8e4ee" }
    }));
    highlightColor = unboundSlice(new formattingSettings.ColorPicker({
        name: "highlightColor",
        displayName: "Highlight",
        value: { value: "#ffff00" }
    }));
    xrayOthers = unboundSlice(new formattingSettings.ToggleSwitch({
        name: "xrayOthers",
        displayName: "X-ray unselected",
        value: true
    }));

    name = "appearance";
    displayName = "Appearance";
    slices: Slice[] = [this.background, this.highlightColor, this.xrayOthers];
}

class SelectionCard extends Card {
    crossFilter = unboundSlice(new formattingSettings.ToggleSwitch({
        name: "crossFilter",
        displayName: "Cross-filter on pick",
        value: true
    }));

    name = "selection";
    displayName = "Selection";
    slices: Slice[] = [this.crossFilter];
}

export class VisualFormattingSettingsModel extends Model {
    model = new ModelCard();
    camera = new CameraCard();
    navCube = new NavCubeCard();
    appearance = new AppearanceCard();
    selection = new SelectionCard();

    cards = [this.model, this.camera, this.navCube, this.appearance, this.selection];
}

export const DEFAULT_MODEL_URL = "http://localhost/metrobi/1.xkt";
