"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import VisualUpdateType = powerbi.VisualUpdateType;

import { VisualFormattingSettingsModel } from "./settings";
import { mapDataView } from "./dataView";
import { XeokitViewerController } from "./xeokitViewer";
import { applyFormattingObjects, enumerateObjectCard, readPersistedModelUrl } from "./format";
import { forceNullSelectors } from "./formattingModel";
import { METROKIT_VERSION } from "./version";

function readMetadataObjects(
    dataViews: powerbi.DataView[] | undefined
): { dataView: powerbi.DataView | undefined; objects: { [name: string]: { [name: string]: unknown } } | undefined } {
    for (const dataView of dataViews || []) {
        const objects = dataView?.metadata?.objects as { [name: string]: { [name: string]: unknown } } | undefined;
        if (objects && Object.keys(objects).length) {
            return { dataView, objects };
        }
    }
    return { dataView: dataViews && dataViews[0], objects: undefined };
}

export class Visual implements IVisual {
    private readonly host: powerbi.extensibility.visual.IVisualHost;
    private readonly events: IVisualEventService;
    private readonly formattingSettingsService: FormattingSettingsService;
    private readonly selectionManager: ISelectionManager;
    private readonly viewerController: XeokitViewerController;
    private formattingSettings: VisualFormattingSettingsModel = new VisualFormattingSettingsModel();

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.events = options.host.eventService;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = options.host.createSelectionManager();
        this.viewerController = new XeokitViewerController(
            options.element,
            this.selectionManager,
            () => Boolean(this.host.hostCapabilities?.allowInteractions !== false),
            METROKIT_VERSION
        );
    }

    public update(options: VisualUpdateOptions): void {
        const { dataView, objects } = readMetadataObjects(options.dataViews);

        if (objects) {
            const next = new VisualFormattingSettingsModel();
            applyFormattingObjects(next.cards, objects);
            next.model.url.value = readPersistedModelUrl(objects, next.model.url.value);
            this.formattingSettings = next;
        }

        const resizeOnly = Boolean(options.type & VisualUpdateType.Resize) &&
            !(options.type & VisualUpdateType.Data) &&
            !(options.type & VisualUpdateType.ViewMode) &&
            !(options.type & VisualUpdateType.Style);

        this.events.renderingStarted(options);
        try {
            if (resizeOnly) {
                this.viewerController.resize();
            } else {
                void this.viewerController.render(this.formattingSettings, mapDataView(dataView, this.host));
            }
            this.events.renderingFinished(options);
        } catch (error) {
            this.events.renderingFailed(options, String(error));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return forceNullSelectors(
            this.formattingSettingsService.buildFormattingModel(this.formattingSettings)
        );
    }

    public enumerateObjectInstances(
        options: powerbi.EnumerateVisualObjectInstancesOptions
    ): powerbi.VisualObjectInstanceEnumeration {
        return enumerateObjectCard(this.formattingSettings.cards, options.objectName);
    }

    public destroy(): void {
        this.viewerController.destroy();
    }
}
