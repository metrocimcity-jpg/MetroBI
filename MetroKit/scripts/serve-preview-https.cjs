"use strict";

const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");

const root = path.resolve(__dirname, "..", "preview");
const certDir = path.join(os.homedir(), "pbiviz-certs");
const port = Number(process.env.PREVIEW_HTTPS_PORT || 8091);

const types = {
    ".ifc": "application/octet-stream",
    ".xkt": "application/octet-stream",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".json": "application/json",
    ".wasm": "application/wasm",
    ".js": "text/javascript; charset=utf-8",
    ".html": "text/html; charset=utf-8"
};

const modelExtensions = new Set([".ifc", ".xkt", ".glb", ".gltf"]);

function safeModelName(raw) {
    const base = String(raw || "").replace(/^\uFEFF/, "").trim();
    if (!base || base !== path.basename(base) || base.includes("..") || /[\\/:*?"<>|]/.test(base)) {
        return null;
    }
    if (!modelExtensions.has(path.extname(base).toLowerCase())) {
        return null;
    }
    return base;
}

function sendJson(res, status, body) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
}

function uploadModel(req, res) {
    let name = null;
    try {
        name = safeModelName(new URL(req.url || "/", "https://localhost").searchParams.get("name"));
    } catch {
        name = null;
    }
    if (!name) {
        sendJson(res, 400, { error: "Choose an .ifc, .xkt, .glb, or .gltf file." });
        return;
    }

    const dest = path.join(root, name);
    const tmp = `${dest}.uploading`;
    const out = fs.createWriteStream(tmp);
    let failed = false;
    let bytes = 0;

    function fail(status, message) {
        if (failed) {
            return;
        }
        failed = true;
        req.unpipe(out);
        out.destroy();
        fs.rm(tmp, { force: true }, () => {});
        if (!res.headersSent) {
            sendJson(res, status, { error: message });
        }
    }

    req.on("data", (chunk) => {
        bytes += chunk.length;
    });
    req.on("error", () => fail(400, "The copy stopped before the file finished."));
    out.on("error", () => fail(500, "Could not save the file in preview."));
    req.pipe(out);
    out.on("finish", () => {
        if (failed) {
            return;
        }
        if (bytes === 0) {
            fail(400, "That file is empty.");
            return;
        }
        fs.rm(dest, { force: true }, (rmErr) => {
            if (rmErr || failed) {
                fail(500, "Could not save the file in preview.");
                return;
            }
            fs.rename(tmp, dest, (renameErr) => {
                if (renameErr || failed) {
                    fs.rm(tmp, { force: true }, () => {});
                    fail(500, "Could not save the file in preview.");
                    return;
                }
                sendJson(res, 200, {
                    name,
                    url: `https://localhost:${port}/${encodeURIComponent(name)}`
                });
            });
        });
    });
}

function loadTls() {
    const pfxPath = path.join(certDir, "PowerBICustomVisualTest_public.pfx");
    const passPath = path.join(certDir, "PowerBICustomVisualTestPass.txt");
    if (!fs.existsSync(pfxPath) || !fs.existsSync(passPath)) {
        throw new Error(`pbiviz certificate not found in ${certDir}`);
    }
    return {
        pfx: fs.readFileSync(pfxPath),
        passphrase: fs.readFileSync(passPath, "utf8").replace(/^\uFEFF/, "").trim()
    };
}

const debugLogPath = path.resolve(__dirname, "..", "..", ".cursor", "debug-cf2d60.log");

function cors(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Private-Network", "true");
    res.setHeader("Access-Control-Max-Age", "86400");
}

function handler(req, res) {
    cors(res);
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }
    if (req.method === "POST" && (req.url || "").split("?")[0] === "/upload") {
        uploadModel(req, res);
        return;
    }
    if (req.method === "POST" && (req.url || "").split("?")[0] === "/__debug") {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
            const line = Buffer.concat(chunks).toString("utf8").replace(/\s+$/, "");
            if (line) {
                fs.mkdirSync(path.dirname(debugLogPath), { recursive: true });
                fs.appendFileSync(debugLogPath, line + "\n");
            }
            res.writeHead(204);
            res.end();
        });
        return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Method not allowed");
        return;
    }

    let pathname = "/";
    try {
        pathname = decodeURIComponent(new URL(req.url || "/", "https://localhost").pathname);
    } catch {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Bad request");
        return;
    }

    const relative = pathname.replace(/^[/\\]+/, "");
    const file = path.resolve(root, relative);
    const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep;
    if (file !== root && !file.startsWith(rootPrefix)) {
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Forbidden");
        return;
    }

    fs.stat(file, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Not found");
            return;
        }
        const type = types[path.extname(file).toLowerCase()] || "application/octet-stream";
        res.writeHead(200, {
            "Content-Type": type,
            "Content-Length": stat.size,
            "Cache-Control": "no-store"
        });
        if (req.method === "HEAD") {
            res.end();
            return;
        }
        fs.createReadStream(file).pipe(res);
    });
}

const tls = loadTls();

function listen(host) {
    const server = https.createServer(tls, handler);
    server.on("error", (error) => {
        console.error(`Could not listen on ${host}:${port}: ${error.message}`);
    });
    server.listen(port, host, () => {
        console.log(`MetroKit preview HTTPS on ${host}:${port}`);
        console.log(`Browse: https://localhost:${port}/browse.html`);
        console.log(`Model URL: https://localhost:${port}/1.ifc`);
    });
}

listen("127.0.0.1");
listen("::1");
