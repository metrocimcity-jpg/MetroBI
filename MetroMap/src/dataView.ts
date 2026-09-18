"use strict";

import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;
import DataView = powerbi.DataView;
import PrimitiveValue = powerbi.PrimitiveValue;

export interface MapRow {
    category: string;
    latitude?: number;
    longitude?: number;
    size?: number;
    color?: number;
    geojson?: string;
    tooltips: Array<[string, string]>;
    identity: ISelectionId;
}

export interface MappedData {
    rows: MapRow[];
    sizeMin: number;
    sizeMax: number;
    colorMin: number;
    colorMax: number;
    colorValues: number[];
}

function asNumber(value: PrimitiveValue): number | undefined {
    if (value === null || value === undefined || value === "") {
        return undefined;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
}

function asText(value: PrimitiveValue): string {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value);
}

function roleIndex(categories: powerbi.DataViewCategoryColumn[] | undefined, role: string): number {
    return (categories || []).findIndex((column) => Boolean(column.source.roles?.[role]));
}

function measureIndex(values: powerbi.DataViewValueColumns | undefined, role: string): number {
    if (!values) {
        return -1;
    }
    return values.findIndex((column) => Boolean(column.source.roles?.[role]));
}

export function mapDataView(
    dataView: DataView | undefined,
    host: powerbi.extensibility.visual.IVisualHost
): MappedData {
    const empty: MappedData = {
        rows: [],
        sizeMin: 0,
        sizeMax: 0,
        colorMin: 0,
        colorMax: 0,
        colorValues: []
    };
    const categorical = dataView?.categorical;
    if (!categorical) {
        return empty;
    }

    const categories = categorical.categories || [];
    const values = categorical.values;
    const categoryIdx = roleIndex(categories, "category");
    const latIdx = roleIndex(categories, "latitude");
    const lngIdx = roleIndex(categories, "longitude");
    const geoIdx = roleIndex(categories, "geojson");
    const tooltipIndexes = categories
        .map((column, index) => column.source.roles?.tooltips ? index : -1)
        .filter((index) => index >= 0);
    const sizeIdx = measureIndex(values, "size");
    const colorIdx = measureIndex(values, "color");

    const rowCount = Math.max(
        0,
        ...categories.map((column) => column.values.length),
        ...(values || []).map((column) => column.values.length)
    );

    const rows: MapRow[] = [];
    const colorValues: number[] = [];
    let sizeMin = Number.POSITIVE_INFINITY;
    let sizeMax = Number.NEGATIVE_INFINITY;
    let colorMin = Number.POSITIVE_INFINITY;
    let colorMax = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < rowCount; i++) {
        const categoryColumn = categoryIdx >= 0 ? categories[categoryIdx] : undefined;
        const identity = host.createSelectionIdBuilder()
            .withCategory(categoryColumn || categories[0], i)
            .createSelectionId();

        const size = sizeIdx >= 0 ? asNumber(values[sizeIdx].values[i]) : undefined;
        const color = colorIdx >= 0 ? asNumber(values[colorIdx].values[i]) : undefined;
        if (size !== undefined) {
            sizeMin = Math.min(sizeMin, size);
            sizeMax = Math.max(sizeMax, size);
        }
        if (color !== undefined) {
            colorMin = Math.min(colorMin, color);
            colorMax = Math.max(colorMax, color);
            colorValues.push(color);
        }

        rows.push({
            category: categoryIdx >= 0 ? asText(categories[categoryIdx].values[i]) : `Feature ${i + 1}`,
            latitude: latIdx >= 0 ? asNumber(categories[latIdx].values[i]) : undefined,
            longitude: lngIdx >= 0 ? asNumber(categories[lngIdx].values[i]) : undefined,
            size,
            color,
            geojson: geoIdx >= 0 ? asText(categories[geoIdx].values[i]) : undefined,
            tooltips: tooltipIndexes.map((index) => [
                categories[index].source.displayName,
                asText(categories[index].values[i])
            ]),
            identity
        });
    }

    return {
        rows,
        sizeMin: Number.isFinite(sizeMin) ? sizeMin : 0,
        sizeMax: Number.isFinite(sizeMax) ? sizeMax : 0,
        colorMin: Number.isFinite(colorMin) ? colorMin : 0,
        colorMax: Number.isFinite(colorMax) ? colorMax : 0,
        colorValues
    };
}
