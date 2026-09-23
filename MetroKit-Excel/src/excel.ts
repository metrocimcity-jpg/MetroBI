"use strict";

/// <reference types="office-js" />

import { PickInfo } from "./viewer";

export function isExcelHost(): boolean {
    return typeof Office !== "undefined" && Office.context?.host === Office.HostType.Excel;
}

export async function writePickToSheet(info: PickInfo): Promise<void> {
    await Excel.run(async (context) => {
        const range = context.workbook.getSelectedRange();
        range.values = [[info.id, info.name, info.type]];
        range.format.autofitColumns();
        await context.sync();
    });
}

export async function readSelectedText(): Promise<string> {
    return Excel.run(async (context) => {
        const range = context.workbook.getSelectedRange();
        range.load("values");
        await context.sync();
        const first = range.values?.[0]?.[0];
        return first == null ? "" : String(first).trim();
    });
}

export async function readSelectedIds(): Promise<string[]> {
    return Excel.run(async (context) => {
        const range = context.workbook.getSelectedRange();
        range.load("values");
        await context.sync();
        const ids: string[] = [];
        for (const row of range.values || []) {
            for (const cell of row) {
                const text = cell == null ? "" : String(cell).trim();
                if (text) {
                    ids.push(text);
                }
            }
        }
        return ids;
    });
}
