"use strict";

import powerbi from "powerbi-visuals-api";

type SliceLike = { name: string; type?: string; value?: unknown };
type CardLike = { name: string; slices?: SliceLike[] };

export function unwrapPrimitive(raw: unknown): unknown {
    let current = raw;
    for (let i = 0; i < 8; i++) {
        if (current == null || typeof current !== "object") {
            return current;
        }
        const obj = current as {
            solid?: { color?: string };
            expr?: unknown;
            literal?: unknown;
            value?: unknown;
        };
        if (typeof obj.solid?.color === "string") {
            return obj.solid.color;
        }
        if (obj.expr !== undefined) {
            current = obj.expr;
            continue;
        }
        if (obj.literal !== undefined) {
            current = obj.literal;
            continue;
        }
        if ("value" in obj && obj.value !== undefined) {
            current = obj.value;
            continue;
        }
        return current;
    }
    return current;
}

function asText(value: unknown): string {
    if (value == null) {
        return "";
    }
    let text = String(value).trim();
    if (
        (text.startsWith("'") && text.endsWith("'")) ||
        (text.startsWith("\"") && text.endsWith("\""))
    ) {
        text = text.slice(1, -1);
    }
    return text;
}

export function applyFormattingObjects(
    cards: CardLike[],
    objects: { [name: string]: { [name: string]: unknown } } | undefined
): void {
    if (!objects) {
        return;
    }
    for (const card of cards) {
        const bag = objects[card.name];
        if (!bag || typeof bag !== "object") {
            continue;
        }
        for (const slice of card.slices || []) {
            const raw = (bag as { [name: string]: unknown })[slice.name];
            if (raw === undefined) {
                continue;
            }
            const next = coerceSliceValue(slice.type, raw, slice.value);
            if (next !== undefined) {
                slice.value = next;
            }
        }
    }
}

export function enumerateObjectCard(
    cards: CardLike[],
    objectName: string
): powerbi.VisualObjectInstance[] {
    const card = cards.find((item) => item.name === objectName);
    if (!card) {
        return [];
    }
    const properties: { [name: string]: powerbi.DataViewPropertyValue } = {};
    for (const slice of card.slices || []) {
        properties[slice.name] = toPersistValue(slice);
    }
    return [{
        objectName,
        properties,
        selector: null as unknown as powerbi.data.Selector
    }];
}

function toPersistValue(slice: SliceLike): powerbi.DataViewPropertyValue {
    if (slice.type === "ColorPicker") {
        const hex = (slice.value as { value?: string } | undefined)?.value || "#3388ff";
        return { solid: { color: hex } } as powerbi.Fill;
    }
    return slice.value as powerbi.DataViewPropertyValue;
}

function coerceSliceValue(type: string | undefined, raw: unknown, fallback: unknown): unknown {
    const unwrapped = unwrapPrimitive(raw);
    switch (type) {
        case "ToggleSwitch":
            if (typeof unwrapped === "boolean") {
                return unwrapped;
            }
            if (unwrapped === 1 || asText(unwrapped).toLowerCase() === "true") {
                return true;
            }
            if (unwrapped === 0 || asText(unwrapped).toLowerCase() === "false") {
                return false;
            }
            return fallback;
        case "TextInput":
        case "TextArea":
            return unwrapped == null ? fallback : asText(unwrapped);
        case "NumUpDown":
        case "Slider": {
            const n = typeof unwrapped === "number" ? unwrapped : Number(asText(unwrapped));
            return Number.isFinite(n) ? n : fallback;
        }
        case "Dropdown":
        case "AutoDropdown":
            if (unwrapped == null || typeof unwrapped === "object") {
                return fallback;
            }
            return unwrapped;
        case "ColorPicker": {
            const color = typeof unwrapped === "string" ? unwrapped : "";
            return color ? { value: color } : fallback;
        }
        default:
            if (typeof unwrapped === "boolean" || typeof unwrapped === "string" || typeof unwrapped === "number") {
                return unwrapped;
            }
            return fallback;
    }
}
