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
import { isHierarchyJson, mapDataView, TreeNode } from "./dataView";
import { SunburstController } from "./sunburst";
import { applyFormattingObjects, enumerateObjectCard, sanitizeJsonUrl } from "./format";
import { forceNullSelectors } from "./formattingModel";
import { SAMPLE_FLARE } from "./sample";
import { METROD3_VERSION } from "./version";

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
    private readonly chart: SunburstController;
    private formattingSettings: VisualFormattingSettingsModel = new VisualFormattingSettingsModel();
    private loadToken = 0;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.events = options.host.eventService;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = options.host.createSelectionManager();
        this.chart = new SunburstController(
            options.element,
            this.selectionManager,
            () => Boolean(this.host.hostCapabilities?.allowInteractions !== false),
            METROD3_VERSION
        );
    }

    public update(options: VisualUpdateOptions): void {
        const { dataView, objects } = readMetadataObjects(options.dataViews);

        if (objects) {
            const next = new VisualFormattingSettingsModel();
            applyFormattingObjects(next.cards, objects);
            next.data.jsonUrl.value = sanitizeJsonUrl(next.data.jsonUrl.value);
            this.formattingSettings = next;
        }

        const resizeOnly = Boolean(options.type & VisualUpdateType.Resize) &&
            !(options.type & VisualUpdateType.Data) &&
            !(options.type & VisualUpdateType.ViewMode) &&
            !(options.type & VisualUpdateType.Style);

        this.events.renderingStarted(options);
        try {
            if (resizeOnly) {
                this.chart.resize();
            } else {
                void this.renderChart(dataView);
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
        this.chart.destroy();
    }

    private async renderChart(dataView: powerbi.DataView | undefined): Promise<void> {
        const token = ++this.loadToken;
        const mapped = mapDataView(dataView, this.host);
        const url = sanitizeJsonUrl(this.formattingSettings.data.jsonUrl.value);

        if (mapped.root) {
            this.chart.render(this.formattingSettings, mapped.root);
            return;
        }

        if (url) {
            this.chart.setStatus("Loading hierarchy JSON…");
            try {
                const root = await fetchHierarchy(url);
                if (token !== this.loadToken) {
                    return;
                }
                this.chart.render(this.formattingSettings, root);
            } catch (error) {
                if (token === this.loadToken) {
                    this.chart.setStatus(error instanceof Error ? error.message : String(error));
                }
            }
            return;
        }

        this.chart.render(this.formattingSettings, SAMPLE_FLARE);
        this.chart.setStatus("Landing page: flare sample. Bind Category + Value, or set Format → Data URL.");
    }
}

async function fetchHierarchy(url: string): Promise<TreeNode> {
    let response: Response;
    try {
        response = await fetch(url, { method: "GET", mode: "cors", credentials: "omit" });
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Could not fetch ${url}. ${detail}`);
    }
    if (!response.ok) {
        throw new Error(`JSON URL returned ${response.status} for ${url}`);
    }
    const json: unknown = await response.json();
    if (!isHierarchyJson(json)) {
        throw new Error("JSON must be { name, value?, children? } like Observable flare-2.json.");
    }
    return json;
}
