"use strict";

const uploadUrl = "https://localhost:8091/upload";
const modelExtensions = [".ifc", ".xkt", ".glb", ".gltf"];

export function modelFileExtension(name: string): string {
    const dot = name.lastIndexOf(".");
    return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function isModelFile(name: string): boolean {
    return modelExtensions.indexOf(modelFileExtension(name)) >= 0;
}

export function uploadModelFile(file: File, onProgress: (percent: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${uploadUrl}?name=${encodeURIComponent(file.name)}`);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                onProgress(Math.round((100 * event.loaded) / event.total));
            }
        };
        xhr.onload = () => {
            let body: { url?: string; error?: string } = {};
            try {
                body = JSON.parse(xhr.responseText) as { url?: string; error?: string };
            } catch {
                body = {};
            }
            if (xhr.status === 200 && body.url) {
                resolve(body.url);
                return;
            }
            reject(new Error(body.error || "The copy failed."));
        };
        xhr.onerror = () => {
            reject(new Error("The preview server is not running. In MetroKit, run npm run preview:https, then browse again."));
        };
        xhr.send(file);
    });
}
