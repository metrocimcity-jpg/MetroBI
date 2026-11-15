"use strict";

import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;
import DataView = powerbi.DataView;
import PrimitiveValue = powerbi.PrimitiveValue;

export interface ModelRow {
    objectId: string;
    label: string;
    modelUrl: string;
    color?: number;
    tooltips: Array<[string, string]>;
    identity: ISelectionId;
}

export interface MappedModelData {
    rows: ModelRow[];
    modelUrl: string;
    objectIds: string[];
    /** Object ids marked by a chart highlight. Null when the host did not send a highlight array. */
    highlightedObjectIds: string[] | null;
}

function asText(value: PrimitiveValue): string {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value);
}

function asNumber(value: PrimitiveValue): number | undefined {
    if (value === null || value === undefined || value === "") {
        return undefined;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
}

function roleIndex(categories: powerbi.DataViewCategoryColumn[] | undefined, role: string): number {
    return (categories || []).findIndex((column) => Boolean(column.source.roles?.[role]));
}

export function mapDataView(
    dataView: DataView | undefined,
    host: powerbi.extensibility.visual.IVisualHost
): MappedModelData {
    const empty: MappedModelData = { rows: [], modelUrl: "", objectIds: [], highlightedObjectIds: null };
    const categorical = dataView?.categorical;
    if (!categorical) {
        return empty;
    }

    const categories = categorical.categories || [];
    const values = categorical.values;
    const idIdx = roleIndex(categories, "objectId");
    const labelIdx = roleIndex(categories, "label");
    const urlIdx = roleIndex(categories, "modelUrl");
    const colorIdx = (values || []).findIndex((column) => Boolean(column.source.roles?.color));
    const tooltipIndexes = categories
        .map((column, index) => column.source.roles?.tooltips ? index : -1)
        .filter((index) => index >= 0);

    const rowCount = Math.max(
        0,
        ...categories.map((column) => column.values.length),
        ...(values || []).map((column) => column.values.length)
    );

    const rows: ModelRow[] = [];
    const objectIds: string[] = [];
    const highlightedObjectIds: string[] = [];
    let modelUrl = "";
    const highlightColumn = findHighlightColumn(categories, values);
    const highlightArray = highlightColumn?.highlights;

    for (let i = 0; i < rowCount; i++) {
        const idColumn = idIdx >= 0 ? categories[idIdx] : categories[0];
        const identity = host.createSelectionIdBuilder()
            .withCategory(idColumn, i)
            .createSelectionId();
        const objectId = idIdx >= 0 ? asText(categories[idIdx].values[i]) : "";
        const rowUrl = urlIdx >= 0 ? asText(categories[urlIdx].values[i]) : "";
        if (rowUrl && !modelUrl) {
            modelUrl = rowUrl;
        }
        if (objectId) {
            objectIds.push(objectId);
            if (highlightArray && highlightArray[i] != null) {
                highlightedObjectIds.push(objectId);
            }
        }
        rows.push({
            objectId,
            label: labelIdx >= 0 ? asText(categories[labelIdx].values[i]) : objectId,
            modelUrl: rowUrl,
            color: colorIdx >= 0 && values ? asNumber(values[colorIdx].values[i]) : undefined,
            tooltips: tooltipIndexes.map((index) => [
                categories[index].source.displayName,
                asText(categories[index].values[i])
            ]),
            identity
        });
    }

    return {
        rows,
        modelUrl,
        objectIds,
        highlightedObjectIds: highlightArray ? highlightedObjectIds : null
    };
}

function findHighlightColumn(
    categories: powerbi.DataViewCategoryColumn[] | undefined,
    values: powerbi.DataViewValueColumns | undefined
): { highlights?: PrimitiveValue[] } | undefined {
    const columns = [...(values || []), ...(categories || [])] as Array<{ highlights?: PrimitiveValue[] }>;
    return columns.find((column) => Array.isArray(column.highlights));
}

/**
 * Chart clicks filter this visual down to the selected rows.
 * The full row set means nothing is selected, so the model stays unhighlighted.
 * A smaller set is the current chart selection.
 */
export function resolveChartHighlight(
    population: Set<string>,
    objectIds: string[],
    explicit: string[] | null
): { population: Set<string>; ids: string[] } {
    if (explicit) {
        return { population, ids: explicit };
    }
    if (!objectIds.length) {
        return { population, ids: [] };
    }
    const incoming = new Set(objectIds);
    const hasNewId = [...incoming].some((id) => !population.has(id));
    if (population.size === 0 || hasNewId || incoming.size > population.size) {
        return { population: incoming, ids: [] };
    }
    if (incoming.size === population.size) {
        return { population, ids: [] };
    }
    return { population, ids: objectIds };
}
