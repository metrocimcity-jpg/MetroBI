"use strict";

const fs = require("fs");
const path = require("path");

const source = path.join(__dirname, "..", "preview", "L-AC-AE-PD-F0327-HVC0-M3D-20003_IFC4x3-elements.csv");
const target = path.join(__dirname, "..", "preview", "fill.dax");
const text = fs.readFileSync(source, "utf8").replace(/^\uFEFF/, "");

function parse(line) {
    const out = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (quoted) {
            if (c === "\"" && line[i + 1] === "\"") {
                cur += "\"";
                i++;
            } else if (c === "\"") {
                quoted = false;
            } else {
                cur += c;
            }
        } else if (c === "\"") {
            quoted = true;
        } else if (c === ",") {
            out.push(cur);
            cur = "";
        } else {
            cur += c;
        }
    }
    out.push(cur);
    return out;
}

const params = parse(text.split(/\r?\n/)[0]).slice(8);
const table = "'L-AC-AE-PD-F0327-HVC0-M3D-20003_IFC4x3-elements'";
const rows = params.map((name) => {
    const col = `${table}[${name.replace(/]/g, "]]")}]`;
    const label = name.replace(/"/g, "\"\"");
    return `        ("${label}", COUNTROWS(FILTER(Source, LEN(TRIM(${col} & "")) > 0)))`;
});

const dax = [
    "Fill =",
    `VAR Source = ${table}`,
    "VAR TotalElements = COUNTROWS(Source)",
    "RETURN",
    "ADDCOLUMNS(",
    "    SELECTCOLUMNS(",
    "        {",
    rows.join(",\n"),
    "        },",
    "        \"Parameter\", [Value1],",
    "        \"Filled elements\", [Value2]",
    "    ),",
    "    \"Filled percent\", DIVIDE([Filled elements], TotalElements)",
    ")"
].join("\n");

fs.writeFileSync(target, dax, "utf8");
console.log(`Wrote ${params.length} parameters`);
