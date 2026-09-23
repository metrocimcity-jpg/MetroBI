"use strict";

/// <reference types="office-js" />

import "core-js/stable";
import "regenerator-runtime/runtime";
import "./content.css";

import { readSharedSettings } from "./bridge";
import { isExcelHost, writePickToSheet } from "./excel";
import { MetroKitSettings, STORAGE_KEY } from "./settings";
import { METROKIT_EXCEL_VERSION } from "./version";
import { PickInfo, XeokitViewerController } from "./viewer";

let viewer: XeokitViewerController;
let current: MetroKitSettings | undefined;
let applied = "";
let refreshing = false;

function onPick(info: PickInfo | undefined): void {
    if (!info || !current?.selection.writeToSheet || !isExcelHost()) {
        return;
    }
    void writePickToSheet(info).catch((error) => {
        console.warn("Could not write pick to the sheet.", error);
    });
}

async function refresh(): Promise<void> {
    if (refreshing) {
        return;
    }
    refreshing = true;
    try {
        const next = await readSharedSettings();
        const signature = JSON.stringify(next);
        if (signature === applied) {
            return;
        }
        current = next;
        applied = signature;
        viewer.setSheetHighlight(next.selection.highlightIds || []);
        await viewer.render(next);
    } finally {
        refreshing = false;
    }
}

function start(): void {
    const host = document.getElementById("viewer");
    if (!host) {
        return;
    }
    viewer = new XeokitViewerController(host, onPick, METROKIT_EXCEL_VERSION);
    window.addEventListener("resize", () => viewer.resize());
    if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(() => viewer.resize()).observe(host);
    }
    window.addEventListener("storage", (event) => {
        if (event.key === STORAGE_KEY) {
            void refresh();
        }
    });
    void refresh();
    window.setInterval(() => {
        void refresh();
    }, 1000);
}

function boot(): void {
    if (typeof Office !== "undefined" && Office.onReady) {
        void Office.onReady().then(start);
        return;
    }
    start();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    boot();
}
