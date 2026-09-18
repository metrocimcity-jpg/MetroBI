const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "node_modules", "powerbi-visuals-tools", "lib", "webpack.config.js");
if (!fs.existsSync(file)) {
    process.exit(0);
}
let text = fs.readFileSync(file, "utf8");
if (text.includes("fs: false")) {
    process.exit(0);
}
text = text.replace(
    "fallback: {",
    "fallback: {\n            fs: false,\n            path: false,"
);
fs.writeFileSync(file, text);
console.log("Patched powerbi-visuals-tools webpack fallback for xeokit (fs/path).");
