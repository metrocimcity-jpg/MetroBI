"use strict";

/// <reference types="office-js" />

import "core-js/stable";
import "regenerator-runtime/runtime";
import "./taskpane.css";

import { publishSettings, readSharedSettings } from "./bridge";
import { isExcelHost, readSelectedIds, readSelectedText } from "./excel";
import { loadSettings, MetroKitSettings } from "./settings";
import { sanitizeModelUrl } from "./format";

let settings: MetroKitSettings = loadSettings();
let taskpaneVisible = false;

function el<T extends HTMLElement>(id: string): T {
    const node = document.getElementById(id);
    if (!node) {
        throw new Error(`Missing #${id}`);
    }
    return node as T;
}

function bindSettingsForm(): void {
    el<HTMLInputElement>("modelUrl").value = settings.model.url;
    el<HTMLSelectElement>("modelFormat").value = settings.model.format;
    el<HTMLInputElement>("edges").checked = settings.model.edges;
    el<HTMLInputElement>("sao").checked = settings.model.sao;
    el<HTMLInputElement>("excludeSpaces").checked = settings.model.excludeSpaces;
    el<HTMLSelectElement>("navMode").value = settings.camera.navMode;
    el<HTMLSelectElement>("projection").value = settings.camera.projection;
    el<HTMLInputElement>("fitOnLoad").checked = settings.camera.fitOnLoad;
    el<HTMLInputElement>("doublePickFlyTo").checked = settings.camera.doublePickFlyTo;
    el<HTMLInputElement>("followPointer").checked = settings.camera.followPointer;
    el<HTMLInputElement>("pivot").checked = settings.camera.pivot;
    el<HTMLInputElement>("cubeShow").checked = settings.navCube.show;
    el<HTMLInputElement>("cubeSize").value = String(settings.navCube.size);
    el<HTMLSelectElement>("cubeAlign").value = settings.navCube.alignment;
    el<HTMLInputElement>("cubeFly").checked = settings.navCube.cameraFly;
    el<HTMLInputElement>("background").value = settings.appearance.background;
    el<HTMLInputElement>("highlight").value = settings.appearance.highlightColor;
    el<HTMLInputElement>("xrayOthers").checked = settings.appearance.xrayOthers;
    el<HTMLInputElement>("writeToSheet").checked = settings.selection.writeToSheet;
}

function readSettingsForm(): MetroKitSettings {
    settings.model.url = el<HTMLInputElement>("modelUrl").value.trim();
    settings.model.format = el<HTMLSelectElement>("modelFormat").value as MetroKitSettings["model"]["format"];
    settings.model.edges = el<HTMLInputElement>("edges").checked;
    settings.model.sao = el<HTMLInputElement>("sao").checked;
    settings.model.excludeSpaces = el<HTMLInputElement>("excludeSpaces").checked;
    settings.camera.navMode = el<HTMLSelectElement>("navMode").value as MetroKitSettings["camera"]["navMode"];
    settings.camera.projection = el<HTMLSelectElement>("projection").value as MetroKitSettings["camera"]["projection"];
    settings.camera.fitOnLoad = el<HTMLInputElement>("fitOnLoad").checked;
    settings.camera.doublePickFlyTo = el<HTMLInputElement>("doublePickFlyTo").checked;
    settings.camera.followPointer = el<HTMLInputElement>("followPointer").checked;
    settings.camera.pivot = el<HTMLInputElement>("pivot").checked;
    settings.navCube.show = el<HTMLInputElement>("cubeShow").checked;
    settings.navCube.size = Number(el<HTMLInputElement>("cubeSize").value) || 160;
    settings.navCube.alignment = el<HTMLSelectElement>("cubeAlign").value as MetroKitSettings["navCube"]["alignment"];
    settings.navCube.cameraFly = el<HTMLInputElement>("cubeFly").checked;
    settings.appearance.background = el<HTMLInputElement>("background").value;
    settings.appearance.highlightColor = el<HTMLInputElement>("highlight").value;
    settings.appearance.xrayOthers = el<HTMLInputElement>("xrayOthers").checked;
    settings.selection.writeToSheet = el<HTMLInputElement>("writeToSheet").checked;
    return settings;
}

function setStatus(message: string): void {
    const status = document.getElementById("status");
    if (status) {
        status.textContent = message;
    }
}

async function applySettings(): Promise<void> {
    try {
        await publishSettings(readSettingsForm());
        setStatus("");
    } catch (error) {
        setStatus(error instanceof Error ? error.message : String(error));
    }
}

async function toggleTaskpane(event: Office.AddinCommands.Event): Promise<void> {
    try {
        if (taskpaneVisible) {
            await Office.addin.hide();
        } else {
            await Office.addin.showAsTaskpane();
        }
    } catch (error) {
        console.warn("Could not toggle the settings pane.", error);
    }
    event.completed();
}

async function start(): Promise<void> {
    const excelReady = isExcelHost();
    settings = await readSharedSettings();
    bindSettingsForm();
    if (excelReady && Office.addin?.onVisibilityModeChanged) {
        void Office.addin.onVisibilityModeChanged((message) => {
            taskpaneVisible = message.visibilityMode === Office.VisibilityMode.taskpane;
        });
    }
    if (Office.actions?.associate) {
        Office.actions.associate("toggleTaskpane", toggleTaskpane);
    }
    if (excelReady) {
        const showInsertStatus = () => {
            try {
                const message = Office.context.document.settings.get("metrokitInsertStatus");
                const node = document.getElementById("insertStatus");
                if (node) {
                    node.textContent = typeof message === "string" ? message : "";
                }
            } catch (error) {
                console.warn("Could not read insert status.", error);
            }
        };
        showInsertStatus();
        window.setInterval(showInsertStatus, 1000);
    }
    el("loadUrl").addEventListener("click", () => {
        void applySettings();
    });
    el("fromCell").addEventListener("click", () => {
        if (!excelReady) {
            return;
        }
        void readSelectedText().then((text) => {
            const url = sanitizeModelUrl(text);
            if (!url) {
                return;
            }
            el<HTMLInputElement>("modelUrl").value = url;
            void applySettings();
        });
    });
    el("highlightSheet").addEventListener("click", () => {
        if (!excelReady) {
            return;
        }
        void readSelectedIds().then((ids) => {
            settings.selection.highlightIds = ids;
            void applySettings();
        });
    });
    for (const id of [
        "modelFormat", "edges", "sao", "excludeSpaces", "navMode", "projection",
        "fitOnLoad", "doublePickFlyTo", "followPointer", "pivot", "cubeShow",
        "cubeSize", "cubeAlign", "cubeFly", "background", "highlight",
        "xrayOthers", "writeToSheet"
    ]) {
        el(id).addEventListener("change", () => {
            void applySettings();
        });
    }
    el("modelUrl").addEventListener("keydown", (event) => {
        if ((event as KeyboardEvent).key === "Enter") {
            void applySettings();
        }
    });
    void applySettings();
}

function boot(): void {
    if (typeof Office !== "undefined" && Office.onReady) {
        void Office.onReady().then(() => {
            void start();
        });
        return;
    }
    void start();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    boot();
}
