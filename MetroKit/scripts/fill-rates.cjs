"use strict";

const fs = require("fs");
const path = require("path");

const source = process.argv[2];
const target = process.argv[3];
const text = fs.readFileSync(source, "utf8").replace(/^\uFEFF/, "");

function parse(line) {
    const out = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (quoted) {
            if (c === "\"") {
                if (line[i + 1] === "\"") {
                    cur += "\"";
                    i++;
                } else {
                    quoted = false;
                }
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

function cell(value) {
    const textValue = String(value);
    if (/[",\r\n]/.test(textValue)) {
        return `"${textValue.replace(/"/g, "\"\"")}"`;
    }
    return textValue;
}

const lines = text.split(/\r?\n/).filter(Boolean);
const header = parse(lines[0]);
const counts = new Array(header.length).fill(0);
let rows = 0;
for (let i = 1; i < lines.length; i++) {
    const cols = parse(lines[i]);
    rows++;
    for (let c = 0; c < header.length; c++) {
        if ((cols[c] || "").trim()) {
            counts[c]++;
        }
    }
}

const fixed = 8;
const stats = header.slice(fixed).map((name, index) => {
    const filled = counts[index + fixed];
    return {
        name,
        filled,
        percent: Math.round((1000 * filled) / rows) / 10
    };
}).sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name));

const output = [
    ["Parameter", "Filled elements", "Total elements", "Filled percent"].join(","),
    ...stats.map((stat) => [stat.name, stat.filled, rows, stat.percent].map(cell).join(","))
];
fs.writeFileSync(target, `\uFEFF${output.join("\r\n")}\r\n`, "utf8");
console.log(`Wrote ${stats.length} parameters to ${path.resolve(target)}`);
