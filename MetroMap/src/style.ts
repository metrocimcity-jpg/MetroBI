"use strict";

const CHOROPLETH = ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"];

export function quantileBreaks(values: number[], count = 7): number[] {
    const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    if (!sorted.length) {
        return [0];
    }
    const breaks: number[] = [];
    for (let i = 1; i <= count; i++) {
        const index = Math.min(sorted.length - 1, Math.floor((i / (count + 1)) * sorted.length));
        breaks.push(sorted[index]);
    }
    return breaks;
}

export function choroplethColor(value: number | undefined, breaks: number[]): string {
    if (value === undefined || !Number.isFinite(value) || !breaks.length) {
        return CHOROPLETH[0];
    }
    let index = 0;
    for (let i = 0; i < breaks.length; i++) {
        if (value > breaks[i]) {
            index = i + 1;
        }
    }
    return CHOROPLETH[Math.min(index, CHOROPLETH.length - 1)];
}

export function scaleRadius(value: number | undefined, minValue: number, maxValue: number, base: number): number {
    if (value === undefined || !Number.isFinite(value) || maxValue <= minValue) {
        return base;
    }
    const t = (value - minValue) / (maxValue - minValue);
    return Math.max(3, base * (0.5 + t * 1.8));
}

export function clampOpacity(value: number): number {
    if (!Number.isFinite(value)) {
        return 1;
    }
    return Math.max(0, Math.min(1, value));
}

export function numericProperty(feature: GeoJSON.Feature | undefined, preferred?: string): number | undefined {
    const props = feature?.properties as Record<string, unknown> | undefined;
    if (!props) {
        return undefined;
    }
    if (preferred && Number.isFinite(Number(props[preferred]))) {
        return Number(props[preferred]);
    }
    for (const key of ["density", "value", "Value", "measure", "color"]) {
        if (Number.isFinite(Number(props[key]))) {
            return Number(props[key]);
        }
    }
    return undefined;
}
