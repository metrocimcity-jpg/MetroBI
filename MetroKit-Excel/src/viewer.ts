"use strict";

import {
    Viewer,
    XKTLoaderPlugin,
    GLTFLoaderPlugin,
    NavCubePlugin,
    WebIFCLoaderPlugin
} from "@xeokit/xeokit-sdk";
import { MetroKitSettings } from "./settings";
import { detectFormat, hexToRgb, sanitizeModelUrl } from "./format";

export type PickInfo = { id: string; name: string; type: string };

type SceneModel = {
    on(event: "loaded", callback: (loaded?: unknown) => void): string;
    on(event: "error", callback: (error?: unknown) => void): string;
    destroy?: () => void;
};

type CameraControlEvents = {
    on(event: "picked", callback: (hit: { entity?: { id?: string; isObject?: boolean } }) => void): void;
    on(event: "pickedNothing", callback: () => void): void;
};

type LoadCfg = {
    id: string;
    edges: boolean;
    saoEnabled: boolean;
    excludeUnclassifiedObjects: boolean;
    excludeTypes: string[];
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
    private settings: MetroKitSettings | undefined;
    private highlightIds: string[] = [];

    constructor(
        private readonly hostElement: HTMLElement,
        private readonly onPick: (info: PickInfo | undefined) => void,
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
        versionEl.textContent = `MetroKit Excel ${version}`;
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

    public setSheetHighlight(ids: string[]): void {
        this.highlightIds = ids.filter(Boolean);
        if (this.settings) {
            this.highlightFromSheet(this.settings);
        }
    }

    public async render(settings: MetroKitSettings): Promise<void> {
        const token = ++this.loadToken;
        this.settings = settings;
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
        this.highlightFromSheet(settings);

        const url = sanitizeModelUrl(settings.model.url);
        const signature = [
            url,
            settings.model.format,
            settings.model.edges,
            settings.model.sao,
            settings.model.excludeSpaces
        ].join("|");
        if (!url) {
            this.setStatus("Set a model URL (.xkt, .gltf/.glb, or .ifc).");
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
            this.highlightFromSheet(settings);
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
            backgroundColor: hexToRgb(this.settings?.appearance.background || "#d8e4ee")
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

        const control = this.viewer.cameraControl as unknown as CameraControlEvents;
        control.on("picked", (hit) => {
            if (!this.settings) {
                return;
            }
            const entity = hit.entity;
            if (!entity || entity.isObject === false) {
                return;
            }
            this.onObjectPicked(String(entity.id), this.settings);
        });
        control.on("pickedNothing", () => {
            this.clearPick();
            this.onPick(undefined);
        });
    }

    private applyCamera(settings: MetroKitSettings): void {
        if (!this.viewer) {
            return;
        }
        const control = this.viewer.cameraControl;
        const navMode = settings.camera.navMode;
        control.navMode = navMode === "firstPerson" || navMode === "planView" ? navMode : "orbit";
        control.doublePickFlyTo = settings.camera.doublePickFlyTo;
        control.followPointer = settings.camera.followPointer;
        control.active = true;
        this.viewer.camera.projection = settings.camera.projection === "ortho" ? "ortho" : "perspective";
        if (settings.camera.pivot) {
            control.pivotPos = this.viewer.scene.center;
        }
    }

    private applyAppearance(settings: MetroKitSettings): void {
        if (!this.viewer) {
            return;
        }
        const rgb = hexToRgb(settings.appearance.background);
        const canvas = this.viewer.scene.canvas as { backgroundColor?: number[] };
        canvas.backgroundColor = rgb;
        const highlight = hexToRgb(settings.appearance.highlightColor);
        this.viewer.scene.highlightMaterial.fillColor = highlight;
        this.viewer.scene.highlightMaterial.edgeColor = highlight;
        this.viewer.scene.highlightMaterial.fillAlpha = 0.6;
        this.hostElement.style.background = settings.appearance.background;
    }

    private applyNavCube(settings: MetroKitSettings): void {
        const size = Math.max(80, Math.min(320, settings.navCube.size || 160));
        this.cubeCanvas.style.width = `${size}px`;
        this.cubeCanvas.style.height = `${size}px`;
        this.cubeCanvas.width = size;
        this.cubeCanvas.height = size;
        this.positionCube(settings.navCube.alignment);
        this.cubeCanvas.style.display = settings.navCube.show ? "block" : "none";
        this.navCube?.setVisible(settings.navCube.show);
        this.navCube?.setCameraFly(settings.navCube.cameraFly);
    }

    private positionCube(alignment: string): void {
        this.cubeCanvas.style.top = alignment.indexOf("top") >= 0 ? "8px" : "auto";
        this.cubeCanvas.style.bottom = alignment.indexOf("bottom") >= 0 || alignment.indexOf("top") < 0 ? "8px" : "auto";
        this.cubeCanvas.style.left = alignment.indexOf("Left") >= 0 ? "8px" : "auto";
        this.cubeCanvas.style.right = alignment.indexOf("Right") >= 0 || alignment.indexOf("Left") < 0 ? "8px" : "auto";
    }

    private async loadModel(
        url: string,
        settings: MetroKitSettings,
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

        const format = detectFormat(url, settings.model.format);
        const loadCfg: LoadCfg = {
            id: "metrokit-excel-model",
            edges: Boolean(settings.model.edges),
            saoEnabled: Boolean(settings.model.sao),
            excludeUnclassifiedObjects: false,
            excludeTypes: settings.model.excludeSpaces ? ["IfcSpace"] : []
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
        if (settings.camera.fitOnLoad) {
            this.viewer.cameraFlight.jumpTo({ aabb: this.viewer.scene.aabb, fit: true });
        }
        this.setStatus("");
    }

    private async loadIfc(loadCfg: LoadCfg): Promise<SceneModel> {
        if (!this.viewer) {
            throw new Error("Viewer is not ready");
        }
        const webIfc = await loadWebIfcFromCdn();
        const IfcAPI = new webIfc.IfcAPI();
        IfcAPI.SetWasmPath("https://cdn.jsdelivr.net/npm/web-ifc@0.0.51/");
        await IfcAPI.Init();
        const loader = new WebIFCLoaderPlugin(this.viewer, { WebIFC: webIfc, IfcAPI });
        return loader.load({ ...loadCfg, loadMetadata: true }) as unknown as SceneModel;
    }

    private highlightFromSheet(settings: MetroKitSettings): void {
        if (!this.viewer) {
            return;
        }
        const scene = this.viewer.scene;
        scene.setObjectsHighlighted(scene.objectIds, false);
        scene.setObjectsXRayed(scene.objectIds, false);
        const ids = this.highlightIds.filter((id) => scene.objects[id]);
        if (!ids.length) {
            return;
        }
        if (settings.appearance.xrayOthers) {
            scene.setObjectsXRayed(scene.objectIds, true);
            scene.setObjectsXRayed(ids, false);
        }
        scene.setObjectsHighlighted(ids, true);
    }

    private onObjectPicked(id: string, settings: MetroKitSettings): void {
        if (!this.viewer) {
            return;
        }
        const scene = this.viewer.scene;
        scene.setObjectsHighlighted(scene.objectIds, false);
        scene.setObjectsXRayed(scene.objectIds, false);
        if (settings.appearance.xrayOthers) {
            scene.setObjectsXRayed(scene.objectIds, true);
            scene.setObjectsXRayed([id], false);
        }
        scene.setObjectsHighlighted([id], true);

        const meta = this.viewer.metaScene?.metaObjects?.[id];
        const name = meta?.name || id;
        const type = meta?.type || "";
        this.infoEl.textContent = type ? `${name}  ·  ${type}` : name;
        this.infoEl.style.display = "block";
        this.onPick({ id, name, type });
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

async function fetchModelBuffer(url: string): Promise<ArrayBuffer> {
    let response: Response;
    try {
        response = await fetch(url, { method: "GET", mode: "cors", credentials: "omit", cache: "no-store" });
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Could not fetch ${url}. ${detail} The host must send CORS headers.`);
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

async function loadWebIfcFromCdn(): Promise<{ IfcAPI: new () => { SetWasmPath: (path: string) => void; Init: () => Promise<void> } }> {
    const global = window as unknown as { WebIFC?: { IfcAPI: new () => { SetWasmPath: (path: string) => void; Init: () => Promise<void> } } };
    if (global.WebIFC) {
        return global.WebIFC;
    }
    await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/web-ifc@0.0.51/web-ifc-api-iife.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Could not load web-ifc. Convert IFC to XKT."));
        document.head.appendChild(script);
    });
    if (!global.WebIFC) {
        throw new Error("web-ifc did not initialize. Convert IFC to XKT.");
    }
    return global.WebIFC;
}
