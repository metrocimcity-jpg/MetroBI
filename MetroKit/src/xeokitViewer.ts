"use strict";

import {
    Viewer,
    XKTLoaderPlugin,
    GLTFLoaderPlugin,
    NavCubePlugin,
    WebIFCLoaderPlugin
} from "@xeokit/xeokit-sdk";
import * as WebIFC from "web-ifc";
import powerbi from "powerbi-visuals-api";
import { VisualFormattingSettingsModel } from "./settings";
import { MappedModelData } from "./dataView";
import { detectFormat, hexToRgb, sanitizeModelUrl } from "./format";

import ISelectionManager = powerbi.extensibility.ISelectionManager;

type SceneModel = {
    on: (event: string, callback: (error?: unknown) => void) => void;
    destroy?: () => void;
    id?: string;
};

type LoadCfg = {
    id: string;
    edges: boolean;
    saoEnabled: boolean;
    excludeUnclassifiedObjects: boolean;
    excludeTypes: string[];
    src?: string;
    xkt?: ArrayBuffer;
    gltf?: ArrayBuffer | object;
    ifc?: ArrayBuffer;
};

export class XeokitViewerController {
    private readonly canvas: HTMLCanvasElement;
    private readonly cubeCanvas: HTMLCanvasElement;
    private readonly statusEl: HTMLElement;
    private readonly infoEl: HTMLElement;
    private viewer: Viewer | undefined;
    private navCube: NavCubePlugin | undefined;
    private xktLoader: XKTLoaderPlugin | undefined;
    private gltfLoader: GLTFLoaderPlugin | undefined;
    private sceneModel: SceneModel | undefined;
    private loadedSignature = "";
    private loadToken = 0;
    private settings: VisualFormattingSettingsModel | undefined;
    private data: MappedModelData = { rows: [], modelUrl: "", objectIds: [] };

    constructor(
        private readonly hostElement: HTMLElement,
        private readonly selectionManager: ISelectionManager,
        private readonly allowInteractions: () => boolean,
        version: string
    ) {
        this.hostElement.classList.add("metrokit-host");

        this.canvas = document.createElement("canvas");
        this.canvas.className = "metrokit-canvas";
        this.canvas.setAttribute("tabindex", "0");
        this.hostElement.appendChild(this.canvas);

        this.cubeCanvas = document.createElement("canvas");
        this.cubeCanvas.className = "metrokit-navcube";
        this.hostElement.appendChild(this.cubeCanvas);

        this.infoEl = document.createElement("div");
        this.infoEl.className = "metrokit-info";
        this.hostElement.appendChild(this.infoEl);

        this.statusEl = document.createElement("div");
        this.statusEl.className = "metrokit-status";
        this.hostElement.appendChild(this.statusEl);

        const versionEl = document.createElement("div");
        versionEl.className = "metrokit-version";
        versionEl.textContent = `MetroKit ${version}`;
        this.hostElement.appendChild(versionEl);
    }

    public resize(): void {
        if (!this.viewer) {
            return;
        }
        const width = Math.max(1, this.hostElement.clientWidth);
        const height = Math.max(1, this.hostElement.clientHeight);
        this.canvas.width = width;
        this.canvas.height = height;
        this.viewer.scene.render(true);
    }

    public destroy(): void {
        this.navCube?.destroy();
        this.sceneModel?.destroy?.();
        this.viewer?.destroy();
        this.viewer = undefined;
    }

    public async render(settings: VisualFormattingSettingsModel, data: MappedModelData): Promise<void> {
        const token = ++this.loadToken;
        this.settings = settings;
        this.data = data;
        try {
            this.ensureViewer();
        } catch (error) {
            this.setStatus(error instanceof Error ? error.message : String(error));
            this.resize();
            return;
        }
        this.applyCamera(settings);
        this.applyAppearance(settings);
        this.applyNavCube(settings);
        this.highlightFromData(settings, data);

        const url = sanitizeModelUrl(data.modelUrl || settings.model.url.value || "");
        const signature = [
            url,
            settings.model.format.value,
            settings.model.edges.value,
            settings.model.sao.value,
            settings.model.excludeSpaces.value
        ].join("|");
        if (!url) {
            this.setStatus("Set a model URL (.xkt, .gltf/.glb, or .ifc) in Format → Model.");
            this.resize();
            return;
        }
        if (signature === this.loadedSignature && this.sceneModel) {
            this.setStatus("");
            this.resize();
            return;
        }
        await this.loadModel(url, settings, token, signature);
        if (token === this.loadToken) {
            this.highlightFromData(settings, data);
            this.resize();
        }
    }

    private ensureViewer(): void {
        if (this.viewer) {
            return;
        }
        this.viewer = new Viewer({
            canvasElement: this.canvas,
            transparent: false,
            dtxEnabled: true,
            backgroundColor: hexToRgb(this.settings?.appearance.background.value.value || "#d8e4ee")
        });
        this.xktLoader = new XKTLoaderPlugin(this.viewer);
        this.gltfLoader = new GLTFLoaderPlugin(this.viewer);
        this.navCube = new NavCubePlugin(this.viewer, {
            canvasElement: this.cubeCanvas,
            visible: true,
            cameraFly: true,
            cameraFitFOV: 45,
            cameraFlyDuration: 0.5
        });

        this.viewer.cameraControl.followPointer = true;
        this.viewer.cameraControl.doublePickFlyTo = true;
        this.viewer.cameraControl.panRightClick = true;

        this.viewer.cameraControl.on("picked", (hit) => {
            if (!this.allowInteractions() || !this.settings) {
                return;
            }
            const entity = hit.entity;
            if (!entity || entity.isObject === false) {
                return;
            }
            this.onObjectPicked(String(entity.id), this.settings);
        });
        this.viewer.cameraControl.on("pickedNothing", () => {
            if (!this.allowInteractions() || !this.settings) {
                return;
            }
            this.clearPick();
            void this.selectionManager.clear();
        });
    }

    private applyCamera(settings: VisualFormattingSettingsModel): void {
        if (!this.viewer) {
            return;
        }
        const control = this.viewer.cameraControl;
        const navMode = settings.camera.navMode.value as string;
        control.navMode = navMode === "firstPerson" || navMode === "planView" ? navMode : "orbit";
        control.doublePickFlyTo = settings.camera.doublePickFlyTo.value;
        control.followPointer = settings.camera.followPointer.value;
        control.active = this.allowInteractions();
        this.viewer.camera.projection = settings.camera.projection.value === "ortho" ? "ortho" : "perspective";
        if (settings.camera.pivot.value) {
            control.pivotPos = this.viewer.scene.center;
        }
    }

    private applyAppearance(settings: VisualFormattingSettingsModel): void {
        if (!this.viewer) {
            return;
        }
        const rgb = hexToRgb(settings.appearance.background.value.value);
        const canvas = this.viewer.scene.canvas as { backgroundColor?: number[] };
        canvas.backgroundColor = rgb;
        const highlight = hexToRgb(settings.appearance.highlightColor.value.value);
        this.viewer.scene.highlightMaterial.fillColor = highlight;
        this.viewer.scene.highlightMaterial.edgeColor = highlight;
        this.viewer.scene.highlightMaterial.fillAlpha = 0.6;
        this.hostElement.style.background = settings.appearance.background.value.value;
    }

    private applyNavCube(settings: VisualFormattingSettingsModel): void {
        const size = Math.max(80, Math.min(320, settings.navCube.size.value || 200));
        this.cubeCanvas.style.width = `${size}px`;
        this.cubeCanvas.style.height = `${size}px`;
        this.cubeCanvas.width = size;
        this.cubeCanvas.height = size;
        this.positionCube(settings.navCube.alignment.value as string);
        this.cubeCanvas.style.display = settings.navCube.show.value ? "block" : "none";
        this.navCube?.setVisible(settings.navCube.show.value);
        this.navCube?.setCameraFly(settings.navCube.cameraFly.value);
    }

    private positionCube(alignment: string): void {
        this.cubeCanvas.style.top = alignment.indexOf("top") >= 0 ? "8px" : "auto";
        this.cubeCanvas.style.bottom = alignment.indexOf("bottom") >= 0 || alignment.indexOf("top") < 0 ? "8px" : "auto";
        this.cubeCanvas.style.left = alignment.indexOf("Left") >= 0 ? "8px" : "auto";
        this.cubeCanvas.style.right = alignment.indexOf("Right") >= 0 || alignment.indexOf("Left") < 0 ? "8px" : "auto";
    }

    private async loadModel(
        url: string,
        settings: VisualFormattingSettingsModel,
        token: number,
        signature: string
    ): Promise<void> {
        if (!this.viewer || !this.xktLoader || !this.gltfLoader) {
            return;
        }
        this.setStatus("Loading model…");
        this.sceneModel?.destroy?.();
        this.sceneModel = undefined;
        this.loadedSignature = "";

        const format = detectFormat(url, settings.model.format.value as string);
        const loadCfg: LoadCfg = {
            id: "metrokit-model",
            edges: Boolean(settings.model.edges.value),
            saoEnabled: Boolean(settings.model.sao.value),
            excludeUnclassifiedObjects: false,
            excludeTypes: settings.model.excludeSpaces.value ? ["IfcSpace"] : []
        };

        try {
            const buffer = await fetchModelBuffer(url);
            if (token !== this.loadToken) {
                return;
            }
            this.setStatus("Parsing model…");
            if (format === "ifc") {
                this.sceneModel = await this.loadIfc({ ...loadCfg, ifc: buffer });
            } else if (format === "gltf") {
                this.sceneModel = this.gltfLoader.load({
                    ...loadCfg,
                    gltf: gltfPayload(url, buffer)
                }) as SceneModel;
            } else {
                this.sceneModel = this.xktLoader.load({
                    ...loadCfg,
                    xkt: buffer
                }) as SceneModel;
            }
            await waitForModel(this.sceneModel);
        } catch (error) {
            this.setStatus(error instanceof Error ? error.message : String(error));
            return;
        }

        if (token !== this.loadToken || !this.viewer) {
            return;
        }
        this.loadedSignature = signature;
        if (settings.camera.fitOnLoad.value) {
            this.viewer.cameraFlight.jumpTo({ aabb: this.viewer.scene.aabb, fit: true });
        }
        this.setStatus("");
    }

    private async loadIfc(loadCfg: LoadCfg): Promise<SceneModel> {
        if (!this.viewer) {
            throw new Error("Viewer is not ready");
        }
        const IfcAPI = new WebIFC.IfcAPI();
        IfcAPI.SetWasmPath("https://localhost:8091/web-ifc/", true);
        await IfcAPI.Init();
        const loader = new WebIFCLoaderPlugin(this.viewer, { WebIFC, IfcAPI });
        return loader.load({ ...loadCfg, ifc: ifcBufferForLoader(loadCfg.ifc), loadMetadata: true });
    }

    private highlightFromData(settings: VisualFormattingSettingsModel, data: MappedModelData): void {
        if (!this.viewer) {
            return;
        }
        const scene = this.viewer.scene;
        scene.setObjectsHighlighted(scene.objectIds, false);
        scene.setObjectsXRayed(scene.objectIds, false);
        if (!data.objectIds.length) {
            return;
        }
        const ids = data.objectIds.filter((id) => scene.objects[id]);
        if (!ids.length) {
            return;
        }
        if (settings.appearance.xrayOthers.value) {
            scene.setObjectsXRayed(scene.objectIds, true);
            scene.setObjectsXRayed(ids, false);
        }
        scene.setObjectsHighlighted(ids, true);
    }

    private onObjectPicked(id: string, settings: VisualFormattingSettingsModel): void {
        if (!this.viewer) {
            return;
        }
        const scene = this.viewer.scene;
        scene.setObjectsHighlighted(scene.objectIds, false);
        scene.setObjectsXRayed(scene.objectIds, false);
        if (settings.appearance.xrayOthers.value) {
            scene.setObjectsXRayed(scene.objectIds, true);
            scene.setObjectsXRayed([id], false);
        }
        scene.setObjectsHighlighted([id], true);

        const meta = this.viewer.metaScene?.metaObjects?.[id];
        const name = meta?.name || id;
        const type = meta?.type || "";
        this.infoEl.textContent = type ? `${name}  ·  ${type}` : name;
        this.infoEl.style.display = "block";

        const row = this.data.rows.find((item) => item.objectId === id);
        if (row && settings.selection.crossFilter.value) {
            void this.selectionManager.select(row.identity, false);
        }
    }

    private clearPick(): void {
        if (!this.viewer) {
            return;
        }
        this.viewer.scene.setObjectsHighlighted(this.viewer.scene.objectIds, false);
        this.viewer.scene.setObjectsXRayed(this.viewer.scene.objectIds, false);
        this.infoEl.style.display = "none";
    }

    private setStatus(message: string): void {
        this.statusEl.textContent = message;
        this.statusEl.style.display = message ? "block" : "none";
    }
}

function ifcBufferForLoader(buffer: ArrayBuffer | undefined): ArrayBuffer | undefined {
    if (!buffer) {
        return buffer;
    }
    const text = new TextDecoder().decode(buffer);
    const from = "FILE_SCHEMA(('IFC4X3_ADD2'))";
    if (!text.includes(from)) {
        return buffer;
    }
    const bytes = new TextEncoder().encode(text.replace(from, "FILE_SCHEMA(('IFC4X3'))"));
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function fetchModelBuffer(url: string): Promise<ArrayBuffer> {
    let response: Response;
    try {
        response = await fetch(url, { method: "GET", mode: "cors", credentials: "omit", cache: "no-store" });
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Could not fetch ${url}. ${detail}`);
    }
    if (!response.ok) {
        throw new Error(`Model URL returned ${response.status} for ${url}`);
    }
    return response.arrayBuffer();
}

function gltfPayload(url: string, data: ArrayBuffer): ArrayBuffer | object {
    const path = url.split("?")[0].toLowerCase();
    if (path.endsWith(".gltf")) {
        return JSON.parse(new TextDecoder().decode(data)) as object;
    }
    return data;
}

function waitForModel(model: SceneModel | undefined): Promise<void> {
    if (!model) {
        return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Model load timed out.")), 180000);
        model.on("loaded", () => {
            clearTimeout(timer);
            resolve();
        });
        model.on("error", (error) => {
            clearTimeout(timer);
            reject(error instanceof Error ? error : new Error("Model failed to parse."));
        });
    });
}

