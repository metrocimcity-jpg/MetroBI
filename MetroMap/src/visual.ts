"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "leaflet/dist/leaflet.css";
import "../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import VisualUpdateType = powerbi.VisualUpdateType;

import { VisualFormattingSettingsModel } from "./settings";
import { mapDataView } from "./dataView";
import { LeafletMapController } from "./leafletMap";

export class Visual implements IVisual {
    private readonly host: powerbi.extensibility.visual.IVisualHost;
    private readonly events: IVisualEventService;
    private readonly formattingSettingsService: FormattingSettingsService;
    private readonly selectionManager: ISelectionManager;
    private readonly mapController: LeafletMapController;
    private formattingSettings: VisualFormattingSettingsModel;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.events = options.host.eventService;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = options.host.createSelectionManager();
        this.mapController = new LeafletMapController(
            options.element,
            this.selectionManager,
            () => Boolean(this.host.hostCapabilities?.allowInteractions !== false)
        );
    }

    public update(options: VisualUpdateOptions): void {
        this.events.renderingStarted(options);
        try {
            const dataView = options.dataViews && options.dataViews[0];
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
                VisualFormattingSettingsModel,
                dataView
            );

            const resizeOnly = Boolean(options.type & VisualUpdateType.Resize) &&
                !(options.type & VisualUpdateType.Data) &&
                !(options.type & VisualUpdateType.ViewMode);

            if (resizeOnly) {
                this.mapController.resize();
                this.events.renderingFinished(options);
                return;
            }

            const data = mapDataView(dataView, this.host);
            void this.mapController.render(this.formattingSettings, data)
                .then(() => this.events.renderingFinished(options))
                .catch((error) => this.events.renderingFailed(options, String(error)));
        } catch (error) {
            this.events.renderingFailed(options, String(error));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    public destroy(): void {
        this.mapController.destroy();
    }
}
