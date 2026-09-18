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
    const empty: MappedModelData = { rows: [], modelUrl: "", objectIds: [] };
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
    let modelUrl = "";

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

    return { rows, modelUrl, objectIds };
}
