"use strict";

export interface MetroKitSettings {
    model: {
        url: string;
        format: "auto" | "xkt" | "gltf" | "ifc";
        edges: boolean;
        sao: boolean;
        excludeSpaces: boolean;
    };
    camera: {
        navMode: "orbit" | "firstPerson" | "planView";
        projection: "perspective" | "ortho";
        fitOnLoad: boolean;
        doublePickFlyTo: boolean;
        followPointer: boolean;
        pivot: boolean;
    };
    navCube: {
        show: boolean;
        size: number;
        alignment: "bottomRight" | "bottomLeft" | "topRight" | "topLeft";
        cameraFly: boolean;
    };
    appearance: {
        background: string;
        highlightColor: string;
        xrayOthers: boolean;
    };
    selection: {
        writeToSheet: boolean;
        highlightIds: string[];
    };
}

export const DEFAULT_MODEL_URL = "http://localhost/metrobi/1.xkt";
export const STORAGE_KEY = "metrokit-excel-settings";

export function defaultSettings(): MetroKitSettings {
    return {
        model: {
            url: DEFAULT_MODEL_URL,
            format: "auto",
            edges: true,
            sao: true,
            excludeSpaces: true
        },
        camera: {
            navMode: "orbit",
            projection: "perspective",
            fitOnLoad: true,
            doublePickFlyTo: true,
            followPointer: true,
            pivot: true
        },
        navCube: {
            show: true,
            size: 160,
            alignment: "bottomRight",
            cameraFly: true
        },
        appearance: {
            background: "#d8e4ee",
            highlightColor: "#ffff00",
            xrayOthers: true
        },
        selection: {
            writeToSheet: true,
            highlightIds: []
        }
    };
}

export function loadSettings(): MetroKitSettings {
    const defaults = defaultSettings();
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return defaults;
        }
        return mergeSettings(defaults, JSON.parse(raw) as Partial<MetroKitSettings>);
    } catch {
        return defaults;
    }
}

export function saveSettings(settings: MetroKitSettings): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function mergeSettings(base: MetroKitSettings, patch: Partial<MetroKitSettings>): MetroKitSettings {
    return {
        model: { ...base.model, ...patch.model },
        camera: { ...base.camera, ...patch.camera },
        navCube: { ...base.navCube, ...patch.navCube },
        appearance: { ...base.appearance, ...patch.appearance },
        selection: {
            ...base.selection,
            ...patch.selection,
            highlightIds: patch.selection?.highlightIds ?? base.selection.highlightIds
        }
    };
}
