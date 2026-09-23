"use strict";

import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;
import DataView = powerbi.DataView;
import PrimitiveValue = powerbi.PrimitiveValue;

export interface TreeNode {
    name: string;
    value?: number;
    children?: TreeNode[];
    identities?: ISelectionId[];
    tooltips?: Array<[string, string]>;
}

export interface MappedSunburst {
    root: TreeNode | undefined;
    fromFields: boolean;
}

function asText(value: PrimitiveValue): string {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value);
}

function asNumber(value: PrimitiveValue): number {
    if (value === null || value === undefined || value === "") {
        return 0;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function roleIndexes(categories: powerbi.DataViewCategoryColumn[] | undefined, role: string): number[] {
    return (categories || [])
        .map((column, index) => column.source.roles?.[role] ? index : -1)
        .filter((index) => index >= 0);
}

function addPath(root: TreeNode, path: string[], value: number, identity: ISelectionId, tooltips: Array<[string, string]>): void {
    let node = root;
    for (let i = 0; i < path.length; i++) {
        const name = path[i];
        if (!name) {
            continue;
        }
        if (!node.children) {
            node.children = [];
        }
        let child = node.children.find((item) => item.name === name);
        if (!child) {
            child = { name, identities: [] };
            node.children.push(child);
        }
        node = child;
    }
    if (!node.identities) {
        node.identities = [];
    }
    node.identities.push(identity);
    node.tooltips = tooltips;
    node.value = (node.value || 0) + value;
}

export function isHierarchyJson(value: unknown): value is TreeNode {
    return Boolean(value && typeof value === "object" && typeof (value as TreeNode).name === "string");
}

export function collectIdentities(node: TreeNode | undefined): ISelectionId[] {
    if (!node) {
        return [];
    }
    const ids = [...(node.identities || [])];
    for (const child of node.children || []) {
        ids.push(...collectIdentities(child));
    }
    return ids;
}

export function mapDataView(
    dataView: DataView | undefined,
    host: powerbi.extensibility.visual.IVisualHost
): MappedSunburst {
    const empty: MappedSunburst = { root: undefined, fromFields: false };
    const categorical = dataView?.categorical;
    if (!categorical) {
        return empty;
    }

    const categories = categorical.categories || [];
    const values = categorical.values;
    const categoryIdxs = roleIndexes(categories, "category");
    const tooltipIdxs = roleIndexes(categories, "tooltips");
    const valueIdx = (values || []).findIndex((column) => Boolean(column.source.roles?.value));

    if (!categoryIdxs.length) {
        return empty;
    }

    const rowCount = Math.max(
        0,
        ...categories.map((column) => column.values.length),
        ...(values || []).map((column) => column.values.length)
    );

    const root: TreeNode = { name: "root", children: [] };

    for (let i = 0; i < rowCount; i++) {
        const path = categoryIdxs.map((index) => asText(categories[index].values[i])).filter(Boolean);
        if (!path.length) {
            continue;
        }
        const idColumn = categories[categoryIdxs[0]];
        const identity = host.createSelectionIdBuilder()
            .withCategory(idColumn, i)
            .createSelectionId();
        const value = valueIdx >= 0 && values ? asNumber(values[valueIdx].values[i]) : 1;
        const tooltips = tooltipIdxs.map((index) => [
            categories[index].source.displayName,
            asText(categories[index].values[i])
        ] as [string, string]);
        addPath(root, path, value, identity, tooltips);
    }

    if (!root.children?.length) {
        return empty;
    }

    if (root.children.length === 1) {
        return { root: root.children[0], fromFields: true };
    }

    return { root, fromFields: true };
}
