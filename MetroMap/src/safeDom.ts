"use strict";

export function textNode(tag: string, text: string, className?: string): HTMLElement {
    const el = document.createElement(tag);
    el.textContent = text ?? "";
    if (className) {
        el.className = className;
    }
    return el;
}

export function popupContent(title: string, rows: Array<[string, string]>): HTMLElement {
    const root = document.createElement("div");
    root.className = "metrobi-popup";
    if (title) {
        root.appendChild(textNode("strong", title, "metrobi-popup-title"));
    }
    for (const [label, value] of rows) {
        if (!value) {
            continue;
        }
        const row = document.createElement("div");
        row.className = "metrobi-popup-row";
        row.appendChild(textNode("span", `${label}: `, "metrobi-popup-label"));
        row.appendChild(textNode("span", value));
        root.appendChild(row);
    }
    return root;
}

export function featureLabel(feature: GeoJSON.Feature | undefined, fallback: string): string {
    const props = feature?.properties as Record<string, unknown> | undefined;
    if (!props) {
        return fallback;
    }
    const keys = ["name", "NAME", "Name", "title", "label", "id", "ID"];
    for (const key of keys) {
        const value = props[key];
        if (value !== undefined && value !== null && String(value).trim()) {
            return String(value);
        }
    }
    return fallback;
}

export function featureRows(feature: GeoJSON.Feature | undefined, limit = 8): Array<[string, string]> {
    const props = feature?.properties as Record<string, unknown> | undefined;
    if (!props) {
        return [];
    }
    return Object.keys(props)
        .slice(0, limit)
        .map((key) => [key, props[key] == null ? "" : String(props[key])]);
}
