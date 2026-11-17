const fs = require("fs");
const path = require("path");

const toolsLib = path.join(__dirname, "..", "node_modules", "powerbi-visuals-tools", "lib");

function patchWebpack() {
    const file = path.join(toolsLib, "webpack.config.js");
    if (!fs.existsSync(file)) {
        return;
    }
    let text = fs.readFileSync(file, "utf8");
    if (text.includes("fs: false")) {
        return;
    }
    text = text.replace(
        "fallback: {",
        "fallback: {\n            fs: false,\n            path: false,"
    );
    fs.writeFileSync(file, text);
    console.log("Patched powerbi-visuals-tools webpack fallback for xeokit (fs/path).");
}

function patchCertificateShell() {
    const file = path.join(toolsLib, "CertificateTools.js");
    if (!fs.existsSync(file)) {
        return;
    }
    let text = fs.readFileSync(file, "utf8");
    const from = "win32: 'pwsh'";
    if (!text.includes(from)) {
        return;
    }
    text = text.replace(from, "win32: 'powershell.exe'");
    fs.writeFileSync(file, text);
    console.log("Patched powerbi-visuals-tools certificate creation to use powershell.exe.");
}

patchWebpack();
patchCertificateShell();
