"use strict";

import * as L from "leaflet";
import powerbi from "powerbi-visuals-api";
import { VisualFormattingSettingsModel } from "./settings";
import { MappedData, MapRow } from "./dataView";
import { fetchJson, fetchShapefile, parseGeoJsonText } from "./layerLoaders";
import { featureLabel, featureRows, popupContent } from "./safeDom";
import { choroplethColor, clampOpacity, quantileBreaks, scaleRadius } from "./style";

import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;

const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const BASEMAPS: Record<string, { url: string; attribution: string; maxZoom: number }> = {
    esriStreet: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles &copy; Esri",
        maxZoom: 19
    },
    esriTopo: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles &copy; Esri",
        maxZoom: 19
    },
    esriImagery: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles &copy; Esri",
        maxZoom: 19
    },
    cartoLight: {
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution: `${OSM_ATTR} &copy; CARTO`,
        maxZoom: 20
    },
    cartoVoyager: {
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        attribution: `${OSM_ATTR} &copy; CARTO`,
        maxZoom: 20
    },
    cartoDark: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: `${OSM_ATTR} &copy; CARTO`,
        maxZoom: 20
    },
    osm: {
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        attribution: `${OSM_ATTR} &copy; CARTO`,
        maxZoom: 20
    }
};

export class LeafletMapController {
    private map: L.Map | undefined;
    private overlayGroup = L.featureGroup();
    private pointGroup = L.featureGroup();
    private geoJsonLayer: L.GeoJSON | undefined;
    private shapeLayer: L.GeoJSON | undefined;
    private wmsLayer: L.TileLayer.WMS | undefined;
    private baseLayer: L.TileLayer | L.TileLayer.WMS | undefined;
    private imageLayer: L.ImageOverlay | undefined;
    private layersControl: L.Control.Layers | undefined;
    private scaleControl: L.Control.Scale | undefined;
    private infoControl: L.Control | undefined;
    private statusEl: HTMLElement;
    private loadToken = 0;

    constructor(
        private readonly hostElement: HTMLElement,
        private readonly selectionManager: ISelectionManager,
        private readonly allowInteractions: () => boolean,
        version: string
    ) {
        this.hostElement.classList.add("leaflet-map-host");
        this.statusEl = document.createElement("div");
        this.statusEl.className = "metrobi-status";
        this.hostElement.appendChild(this.statusEl);

        const versionEl = document.createElement("div");
        versionEl.className = "metromap-version";
        versionEl.textContent = `MetroMap ${version}`;
        this.hostElement.appendChild(versionEl);
    }

    public resize(): void {
        this.map?.invalidateSize({ animate: false });
    }

    public destroy(): void {
        this.map?.remove();
        this.map = undefined;
    }

    public async render(settings: VisualFormattingSettingsModel, data: MappedData): Promise<void> {
        const token = ++this.loadToken;
        this.ensureMap(settings);
        this.applyInteraction(settings);
        this.resetOverlays();
        this.updateBasemap(settings);
        this.updateWms(settings);
        this.updateImageOverlay(settings);
        this.addPointMarkers(settings, data);
        this.addInlineGeoJson(settings, data);

        const bounds = L.latLngBounds([]);
        this.collectBounds(bounds);

        try {
            await this.loadRemoteLayers(settings, data, bounds, token);
        } catch (error) {
            this.setStatus(error instanceof Error ? error.message : String(error));
        }

        if (token !== this.loadToken || !this.map) {
            return;
        }

        this.rebuildControls(settings);
        this.fitView(settings, bounds);
        this.map.invalidateSize({ animate: false });
    }

    private ensureMap(settings: VisualFormattingSettingsModel): void {
        if (this.map) {
            return;
        }
        const mapDiv = document.createElement("div");
        mapDiv.className = "metrobi-map";
        this.hostElement.insertBefore(mapDiv, this.statusEl);
        this.map = L.map(mapDiv, {
            center: [settings.map.centerLat.value, settings.map.centerLng.value],
            zoom: settings.map.zoom.value,
            minZoom: settings.map.minZoom.value,
            maxZoom: settings.map.maxZoom.value,
            zoomSnap: settings.map.zoomSnap.value,
            zoomDelta: settings.map.zoomDelta.value,
            preferCanvas: settings.map.preferCanvas.value,
            attributionControl: true,
            zoomControl: settings.interaction.zoomControl.value,
            crs: settings.map.crs.value === "EPSG4326" ? L.CRS.EPSG4326 : L.CRS.EPSG3857,
            worldCopyJump: true
        });
        this.overlayGroup.addTo(this.map);
        this.pointGroup.addTo(this.map);
        this.map.on("click", (event: L.LeafletMouseEvent) => {
            const original = event.originalEvent.target as HTMLElement | null;
            if (original?.classList.contains("leaflet-container") || original?.classList.contains("metrobi-map")) {
                this.selectionManager.clear();
            }
        });
    }

    private applyInteraction(settings: VisualFormattingSettingsModel): void {
        if (!this.map) {
            return;
        }
        toggleHandler(this.map.dragging, settings.interaction.dragging.value && this.allowInteractions());
        toggleHandler(this.map.scrollWheelZoom, settings.interaction.scrollWheelZoom.value && this.allowInteractions());
        toggleHandler(this.map.doubleClickZoom, settings.interaction.doubleClickZoom.value && this.allowInteractions());
        toggleHandler(this.map.boxZoom, settings.interaction.boxZoom.value && this.allowInteractions());
        toggleHandler(this.map.keyboard, settings.interaction.keyboard.value && this.allowInteractions());
        this.map.setMinZoom(settings.map.minZoom.value);
        this.map.setMaxZoom(settings.map.maxZoom.value);
    }

    private resetOverlays(): void {
        this.overlayGroup.clearLayers();
        this.pointGroup.clearLayers();
        this.geoJsonLayer = undefined;
        this.shapeLayer = undefined;
        this.wmsLayer = undefined;
        this.imageLayer = undefined;
        this.setStatus("");
    }

    private updateBasemap(settings: VisualFormattingSettingsModel): void {
        if (!this.map) {
            return;
        }
        if (this.baseLayer) {
            this.map.removeLayer(this.baseLayer);
            this.baseLayer = undefined;
        }
        const provider = settings.basemap.provider.value as string;
        if (provider === "none") {
            return;
        }
        const spec = BASEMAPS[provider] || BASEMAPS.esriStreet;
        this.baseLayer = L.tileLayer(spec.url, {
            attribution: spec.attribution,
            maxZoom: spec.maxZoom,
            opacity: clampOpacity(settings.basemap.opacity.value),
            tms: settings.basemap.tms.value,
            referrerPolicy: "no-referrer"
        }).addTo(this.map);
    }

    private updateWms(settings: VisualFormattingSettingsModel): void {
        if (!this.map || !settings.wms.show.value || !settings.wms.url.value.trim() || !settings.wms.layers.value.trim()) {
            return;
        }
        this.wmsLayer = L.tileLayer.wms(settings.wms.url.value.trim(), {
            layers: settings.wms.layers.value.trim(),
            styles: settings.wms.styles.value.trim(),
            format: settings.wms.format.value.trim() || "image/png",
            transparent: settings.wms.transparent.value,
            version: settings.wms.version.value.trim() || "1.1.1",
            uppercase: settings.wms.uppercase.value,
            opacity: clampOpacity(settings.wms.opacity.value),
            attribution: "WMS"
        });
        this.wmsLayer.addTo(this.map);
        if (!settings.wms.asBasemap.value) {
            this.wmsLayer.setZIndex(4);
        }
    }

    private updateImageOverlay(settings: VisualFormattingSettingsModel): void {
        if (!this.map || !settings.imageOverlay.url.value.trim()) {
            return;
        }
        const bounds = L.latLngBounds(
            [settings.imageOverlay.south.value, settings.imageOverlay.west.value],
            [settings.imageOverlay.north.value, settings.imageOverlay.east.value]
        );
        if (!bounds.isValid()) {
            return;
        }
        this.imageLayer = L.imageOverlay(settings.imageOverlay.url.value.trim(), bounds, {
            opacity: clampOpacity(settings.imageOverlay.opacity.value),
            alt: "Image overlay",
            interactive: false
        }).addTo(this.map);
    }

    private addPointMarkers(settings: VisualFormattingSettingsModel, data: MappedData): void {
        const breaks = quantileBreaks(data.colorValues);
        for (const row of data.rows) {
            if (row.latitude === undefined || row.longitude === undefined) {
                continue;
            }
            const marker = L.circleMarker([row.latitude, row.longitude], {
                radius: scaleRadius(row.size, data.sizeMin, data.sizeMax, settings.points.radius.value),
                color: settings.points.color.value.value,
                weight: settings.points.weight.value,
                fillColor: data.colorValues.length
                    ? choroplethColor(row.color, breaks)
                    : settings.points.color.value.value,
                fillOpacity: clampOpacity(settings.points.fillOpacity.value),
                alt: row.category
            } as L.CircleMarkerOptions);
            this.bindRowChrome(marker, row, settings);
            this.pointGroup.addLayer(marker);
        }
    }

    private addInlineGeoJson(settings: VisualFormattingSettingsModel, data: MappedData): void {
        const features: GeoJSON.Feature[] = [];
        const identities: ISelectionId[] = [];
        for (const row of data.rows) {
            const parsed = row.geojson ? parseGeoJsonText(row.geojson) : undefined;
            if (!parsed) {
                continue;
            }
            if (parsed.type === "FeatureCollection") {
                for (const feature of (parsed as GeoJSON.FeatureCollection).features) {
                    features.push(feature);
                    identities.push(row.identity);
                }
            } else if (parsed.type === "Feature") {
                const feature = parsed as GeoJSON.Feature;
                feature.properties = { ...(feature.properties || {}), name: row.category, color: row.color };
                features.push(feature);
                identities.push(row.identity);
            } else {
                features.push({
                    type: "Feature",
                    properties: { name: row.category, color: row.color },
                    geometry: parsed as GeoJSON.Geometry
                });
                identities.push(row.identity);
            }
        }
        if (!features.length) {
            return;
        }
        this.geoJsonLayer = this.createGeoJsonLayer(
            { type: "FeatureCollection", features } as GeoJSON.FeatureCollection,
            settings,
            data,
            "GeoJSON",
            identities
        );
        this.overlayGroup.addLayer(this.geoJsonLayer);
    }

    private async loadRemoteLayers(
        settings: VisualFormattingSettingsModel,
        data: MappedData,
        bounds: L.LatLngBounds,
        token: number
    ): Promise<void> {
        const geoUrl = settings.geojson.url.value.trim();
        const shpUrl = settings.shapefile.url.value.trim();
        if (geoUrl) {
            const geojson = await fetchJson(geoUrl);
            if (token !== this.loadToken || !this.map) {
                return;
            }
            this.geoJsonLayer = this.createGeoJsonLayer(geojson, settings, data, "GeoJSON URL");
            this.overlayGroup.addLayer(this.geoJsonLayer);
            this.collectBounds(bounds);
        }
        if (shpUrl) {
            const shape = await fetchShapefile(shpUrl);
            if (token !== this.loadToken || !this.map) {
                return;
            }
            this.shapeLayer = this.createGeoJsonLayer(shape, settings, data, "Shapefile", undefined, true);
            this.overlayGroup.addLayer(this.shapeLayer);
            this.collectBounds(bounds);
        }
        if (!geoUrl && !shpUrl) {
            this.setStatus("");
        }
    }

    private createGeoJsonLayer(
        data: GeoJSON.GeoJsonObject,
        settings: VisualFormattingSettingsModel,
        mapped: MappedData,
        fallbackName: string,
        identities?: ISelectionId[],
        shapefile = false
    ): L.GeoJSON {
        const color = shapefile ? settings.shapefile.color.value.value : settings.geojson.color.value.value;
        const weight = shapefile ? settings.shapefile.weight.value : settings.geojson.weight.value;
        const fillOpacity = shapefile ? settings.shapefile.fillOpacity.value : settings.geojson.fillOpacity.value;
        const breaks = quantileBreaks(mapped.colorValues);
        let featureIndex = 0;

        const layer = L.geoJSON(data, {
            style: (feature) => {
                const value = settings.geojson.choropleth.value ? numericFromFeatureOrData(feature, mapped, featureIndex) : undefined;
                return {
                    color,
                    weight,
                    fillColor: value === undefined ? color : choroplethColor(value, breaks),
                    fillOpacity: clampOpacity(fillOpacity),
                    opacity: 1
                };
            },
            pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
                radius: settings.points.radius.value,
                color,
                fillColor: color,
                fillOpacity: clampOpacity(fillOpacity),
                weight,
                alt: featureLabel(feature, fallbackName)
            } as L.CircleMarkerOptions),
            onEachFeature: (feature, featureLayer) => {
                const currentIndex = featureIndex++;
                const title = featureLabel(feature, fallbackName);
                featureLayer.bindPopup(popupContent(title, featureRows(feature)));
                featureLayer.bindTooltip(popupContent(title, []), { sticky: true, direction: "top" });
                if (settings.geojson.highlight.value && featureLayer.on) {
                    featureLayer.on({
                        mouseover: (event: L.LeafletMouseEvent) => {
                            const target = event.target as L.Path;
                            target.setStyle({ weight: weight + 2, color: "#333333" });
                            if (target.bringToFront) {
                                target.bringToFront();
                            }
                        },
                        mouseout: () => layer.resetStyle(featureLayer)
                    });
                }
                if (settings.geojson.zoomOnClick.value) {
                    featureLayer.on("click", (event: L.LeafletMouseEvent) => {
                        const target = event.target as L.Polygon;
                        if (target.getBounds && this.map) {
                            this.map.fitBounds(target.getBounds(), { padding: [24, 24], maxZoom: 14 });
                        }
                        const identity = identities?.[currentIndex];
                        if (identity && settings.interaction.crossFilter.value && this.allowInteractions()) {
                            this.selectionManager.select(identity, Boolean((event.originalEvent as MouseEvent).ctrlKey));
                        }
                    });
                }
            }
        });
        return layer;
    }

    private bindRowChrome(layer: L.Layer, row: MapRow, settings: VisualFormattingSettingsModel): void {
        const rows: Array<[string, string]> = [["Category", row.category], ...row.tooltips];
        if (row.size !== undefined) {
            rows.push(["Size", String(row.size)]);
        }
        if (row.color !== undefined) {
            rows.push(["Color", String(row.color)]);
        }
        layer.bindPopup(popupContent(row.category, rows));
        layer.bindTooltip(popupContent(row.category, []), { sticky: true, direction: "top" });
        layer.on("click", (event: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(event);
            if (settings.interaction.crossFilter.value && this.allowInteractions()) {
                this.selectionManager.select(row.identity, Boolean((event.originalEvent as MouseEvent).ctrlKey));
            }
        });
    }

    private collectBounds(bounds: L.LatLngBounds): void {
        const groups = [this.pointGroup, this.overlayGroup];
        for (const group of groups) {
            const groupBounds = group.getBounds();
            if (groupBounds.isValid()) {
                bounds.extend(groupBounds);
            }
        }
        if (this.imageLayer) {
            bounds.extend(this.imageLayer.getBounds());
        }
    }

    private fitView(settings: VisualFormattingSettingsModel, bounds: L.LatLngBounds): void {
        if (!this.map) {
            return;
        }
        if (settings.map.fitToData.value && bounds.isValid()) {
            this.map.fitBounds(bounds, {
                padding: [28, 28],
                maxZoom: Math.min(14, settings.map.maxZoom.value)
            });
            return;
        }
        this.map.setView(
            [settings.map.centerLat.value, settings.map.centerLng.value],
            settings.map.zoom.value
        );
    }

    private rebuildControls(settings: VisualFormattingSettingsModel): void {
        if (!this.map) {
            return;
        }
        this.layersControl?.remove();
        this.scaleControl?.remove();
        this.infoControl?.remove();
        if (settings.interaction.scaleControl.value) {
            this.scaleControl = L.control.scale({ metric: true, imperial: true }).addTo(this.map);
        }
        if (settings.interaction.layersControl.value) {
            const bases: Record<string, L.Layer> = {};
            const overlays: Record<string, L.Layer> = {};
            if (this.baseLayer) {
                bases["Basemap"] = this.baseLayer;
            }
            if (this.wmsLayer) {
                if (settings.wms.asBasemap.value) {
                    bases["WMS"] = this.wmsLayer;
                } else {
                    overlays["WMS"] = this.wmsLayer;
                }
            }
            if (this.pointGroup.getLayers().length) {
                overlays["Points"] = this.pointGroup;
            }
            if (this.geoJsonLayer) {
                overlays["GeoJSON"] = this.geoJsonLayer;
            }
            if (this.shapeLayer) {
                overlays["Shapefile"] = this.shapeLayer;
            }
            if (this.imageLayer) {
                overlays["Image"] = this.imageLayer;
            }
            this.layersControl = L.control.layers(bases, overlays, { collapsed: true, position: "topright" }).addTo(this.map);
        }
    }

    private setStatus(message: string): void {
        this.statusEl.textContent = message;
        this.statusEl.style.display = message ? "block" : "none";
    }
}

function toggleHandler(handler: L.Handler | undefined, enabled: boolean): void {
    if (!handler) {
        return;
    }
    if (enabled) {
        handler.enable();
    } else {
        handler.disable();
    }
}

function numericFromFeatureOrData(
    feature: GeoJSON.Feature | undefined,
    data: MappedData,
    index: number
): number | undefined {
    const fromRow = data.rows[index]?.color;
    if (fromRow !== undefined) {
        return fromRow;
    }
    const props = feature?.properties as Record<string, unknown> | undefined;
    if (!props) {
        return undefined;
    }
    for (const key of ["density", "value", "Value", "measure", "color"]) {
        if (Number.isFinite(Number(props[key]))) {
            return Number(props[key]);
        }
    }
    return undefined;
}
