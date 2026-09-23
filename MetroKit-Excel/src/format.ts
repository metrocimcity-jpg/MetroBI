"use strict";

export type ModelFormat = "xkt" | "gltf" | "ifc";

export function detectFormat(url: string, explicit: string): ModelFormat {
    if (explicit && explicit !== "auto") {
        return explicit as ModelFormat;
    }
    const path = url.split("?")[0].toLowerCase();
    if (path.endsWith(".ifc")) {
        return "ifc";
    }
    if (path.endsWith(".gltf") || path.endsWith(".glb")) {
        return "gltf";
    }
    return "xkt";
}

export function sanitizeModelUrl(url: string): string {
    const trimmed = (url || "").trim();
    if (!/^https?:\/\//i.test(trimmed)) {
        return "";
    }
    if (/example\.com\/model\.xkt/i.test(trimmed)) {
        return "";
    }
    return trimmed;
}

export function hexToRgb(hex: string): number[] {
    const value = (hex || "#d8e4ee").replace("#", "");
    const full = value.length === 3
        ? value.split("").map((c) => c + c).join("")
        : value.padEnd(6, "0").slice(0, 6);
    const n = parseInt(full, 16);
    return [
        ((n >> 16) & 255) / 255,
        ((n >> 8) & 255) / 255,
        (n & 255) / 255
    ];
}
