"use strict";

/// <reference types="office-js" />

import { isExcelHost } from "./excel";
import { loadSettings, mergeSettings, MetroKitSettings, saveSettings } from "./settings";

const SHEET_NAME = "MetroKitConfig";

export async function publishSettings(settings: MetroKitSettings): Promise<void> {
    saveSettings(settings);
    if (!isExcelHost()) {
        return;
    }
    const json = JSON.stringify(settings);
    await Excel.run(async (context) => {
        const sheets = context.workbook.worksheets;
        let sheet = sheets.getItemOrNullObject(SHEET_NAME);
        sheet.load("name");
        await context.sync();
        if (sheet.isNullObject) {
            sheet = sheets.add(SHEET_NAME);
            sheet.visibility = Excel.SheetVisibility.veryHidden;
        }
        sheet.getRange("A1").values = [[json]];
        await context.sync();
    });
}

export async function readSharedSettings(): Promise<MetroKitSettings> {
    const local = loadSettings();
    if (!isExcelHost()) {
        return local;
    }
    try {
        const json = await Excel.run(async (context) => {
            const sheet = context.workbook.worksheets.getItemOrNullObject(SHEET_NAME);
            sheet.load("name");
            await context.sync();
            if (sheet.isNullObject) {
                return "";
            }
            const cell = sheet.getRange("A1");
            cell.load("values");
            await context.sync();
            const value = cell.values?.[0]?.[0];
            return value == null ? "" : String(value);
        });
        if (!json) {
            return local;
        }
        return mergeSettings(local, JSON.parse(json) as Partial<MetroKitSettings>);
    } catch {
        return local;
    }
}
