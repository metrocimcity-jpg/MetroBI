"use strict";

/// <reference path="./shpjs.d.ts" />
import shp from "shpjs";

function asFeatureCollection(parsed: GeoJSON.FeatureCollection | GeoJSON.FeatureCollection[]): GeoJSON.FeatureCollection {
    if (Array.isArray(parsed)) {
        return {
            type: "FeatureCollection",
            features: parsed.flatMap((item) => item.features || [])
        };
    }
    return parsed;
}

export async function fetchJson(url: string): Promise<GeoJSON.GeoJsonObject> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed (${response.status}) for ${url}`);
    }
    return response.json();
}

export async function fetchShapefile(url: string): Promise<GeoJSON.FeatureCollection> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Shapefile request failed (${response.status}) for ${url}`);
    }
    const buffer = await response.arrayBuffer();
    const parsed = await shp(buffer);
    return asFeatureCollection(parsed as GeoJSON.FeatureCollection | GeoJSON.FeatureCollection[]);
}

export function parseGeoJsonText(text: string): GeoJSON.GeoJsonObject | undefined {
    if (!text || !text.trim()) {
        return undefined;
    }
    const trimmed = text.trim();
    if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
        return undefined;
    }
    try {
        return JSON.parse(trimmed) as GeoJSON.GeoJsonObject;
    } catch {
        return undefined;
    }
}
