"use strict";

/// <reference types="office-js" />

import { VIEWER_WORKBOOK_BASE64 } from "./viewerTemplate";

function isViewerShape(name: string): boolean {
    return /^OfficeApp/i.test(name) || /^MetroKit/i.test(name);
}

function report(message: string): void {
    try {
        Office.context.document.settings.set("metrokitInsertStatus", message);
        Office.context.document.settings.saveAsync();
    } catch (error) {
        console.warn("Could not report insert status.", error);
    }
}

async function copyViewerShape(source: Excel.Shape, target: Excel.Worksheet): Promise<void> {
    const copy = source.copyTo(target);
    copy.load("left,top");
    await target.context.sync();
    copy.left = 48;
    copy.top = 36;
    await target.context.sync();
}

async function findViewerShape(context: Excel.RequestContext): Promise<Excel.Shape | undefined> {
    const sheets = context.workbook.worksheets;
    sheets.load("items");
    await context.sync();
    for (const sheet of sheets.items) {
        const shapes = sheet.shapes;
        shapes.load("items/name");
        await context.sync();
        const found = shapes.items.find((shape) => isViewerShape(shape.name));
        if (found) {
            return found;
        }
    }
    return undefined;
}

async function insertMetroKit(): Promise<string> {
    return Excel.run(async (context) => {
        const sheets = context.workbook.worksheets;
        const active = sheets.getActiveWorksheet();
        active.load("name");
        sheets.load("items/name");
        await context.sync();

        const existingShape = await findViewerShape(context);
        if (existingShape) {
            await copyViewerShape(existingShape, active);
            return "MetroKit was placed on this sheet.";
        }

        const template = sheets.items.find((sheet) => sheet.name === "MetroKit");
        if (template) {
            const copy = template.copy(Excel.WorksheetPositionType.after, active);
            copy.activate();
            await context.sync();
            return "MetroKit was added on a new sheet.";
        }

        const insertedIds = context.workbook.insertWorksheetsFromBase64(VIEWER_WORKBOOK_BASE64, {
            sheetNamesToInsert: ["MetroKit"],
            positionType: Excel.WorksheetPositionType.after,
            relativeTo: active
        });
        await context.sync();
        const inserted = sheets.getItem(insertedIds.value[0]);
        inserted.load("name");
        const shapes = inserted.shapes;
        shapes.load("items/name");
        await context.sync();
        const planted = shapes.items.find((shape) => isViewerShape(shape.name));
        if (planted) {
            await copyViewerShape(planted, active);
            inserted.delete();
            await context.sync();
            return "MetroKit was placed on this sheet.";
        }
        inserted.activate();
        await context.sync();
        return "MetroKit was added on the MetroKit sheet.";
    });
}

function onInsert(event: Office.AddinCommands.Event): void {
    void insertMetroKit().then(
        (message) => {
            report(message);
            event.completed();
        },
        (error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            report(message);
            console.warn("Could not insert MetroKit.", error);
            event.completed();
        }
    );
}

Office.onReady(() => {
    Office.actions.associate("insertMetroKit", onInsert);
});
