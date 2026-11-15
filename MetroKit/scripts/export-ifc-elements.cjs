"use strict";

const fs = require("fs");
const path = require("path");

const ifcPath = process.argv[2] || path.join(__dirname, "..", "preview", "1.ifc");
const csvPath = process.argv[3] || path.join(__dirname, "..", "preview", "1-elements.csv");

const ELEMENT_TYPES = new Set([
    "IFCBUILDINGELEMENTPROXY",
    "IFCCABLECARRIERSEGMENT",
    "IFCCABLECARRIERFITTING"
]);

const TYPE_LABEL = {
    IFCBUILDINGELEMENTPROXY: "IfcBuildingElementProxy",
    IFCCABLECARRIERSEGMENT: "IfcCableCarrierSegment",
    IFCCABLECARRIERFITTING: "IfcCableCarrierFitting"
};

function splitTop(body) {
    const parts = [];
    let cur = "";
    let depth = 0;
    let inStr = false;
    for (let i = 0; i < body.length; i++) {
        const c = body[i];
        if (inStr) {
            cur += c;
            if (c === "'") {
                if (body[i + 1] === "'") {
                    cur += "'";
                    i++;
                } else {
                    inStr = false;
                }
            }
            continue;
        }
        if (c === "'") {
            inStr = true;
            cur += c;
            continue;
        }
        if (c === "(") {
            depth++;
            cur += c;
            continue;
        }
        if (c === ")") {
            depth--;
            cur += c;
            continue;
        }
        if (c === "," && depth === 0) {
            parts.push(cur.trim());
            cur = "";
            continue;
        }
        cur += c;
    }
    if (cur.trim()) {
        parts.push(cur.trim());
    }
    return parts;
}

function decode(raw) {
    if (raw == null) {
        return null;
    }
    const text = String(raw).trim();
    if (text === "" || text === "$" || text === "*") {
        return null;
    }
    if (text.startsWith("'") && text.endsWith("'")) {
        return text.slice(1, -1).replace(/''/g, "'");
    }
    if (text.startsWith("#")) {
        return { ref: Number(text.slice(1)) };
    }
    if (text.startsWith("(") && text.endsWith(")")) {
        return splitTop(text.slice(1, -1)).map(decode);
    }
    if (text.startsWith(".") && text.endsWith(".")) {
        return text.slice(1, -1);
    }
    const typed = text.match(/^([A-Z0-9_]+)\((.*)\)$/s);
    if (typed) {
        return decode(typed[2]);
    }
    if (/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(text)) {
        return Number(text);
    }
    return text;
}

function parseEntities(ifcText) {
    const dataStart = ifcText.indexOf("DATA;");
    const dataEnd = ifcText.indexOf("ENDSEC;", dataStart);
    const data = ifcText.slice(dataStart, dataEnd);
    const entities = new Map();
    let i = 0;
    while (i < data.length) {
        const hash = data.indexOf("#", i);
        if (hash < 0) {
            break;
        }
        const eq = data.indexOf("=", hash);
        if (eq < 0) {
            break;
        }
        const idText = data.slice(hash + 1, eq).trim();
        if (!/^\d+$/.test(idText)) {
            i = hash + 1;
            continue;
        }
        let j = eq + 1;
        while (j < data.length && /\s/.test(data[j])) {
            j++;
        }
        const nameStart = j;
        while (j < data.length && /[A-Z0-9_]/.test(data[j])) {
            j++;
        }
        const name = data.slice(nameStart, j);
        const open = data.indexOf("(", j);
        if (!name || open < 0) {
            i = hash + 1;
            continue;
        }
        let depth = 0;
        let inStr = false;
        let end = open;
        for (; end < data.length; end++) {
            const c = data[end];
            if (inStr) {
                if (c === "'" && data[end + 1] === "'") {
                    end++;
                    continue;
                }
                if (c === "'") {
                    inStr = false;
                }
                continue;
            }
            if (c === "'") {
                inStr = true;
                continue;
            }
            if (c === "(") {
                depth++;
            } else if (c === ")") {
                depth--;
                if (depth === 0) {
                    end++;
                    break;
                }
            }
        }
        const args = splitTop(data.slice(open + 1, end - 1)).map(decode);
        entities.set(Number(idText), { name, args });
        i = end;
    }
    return entities;
}

function refId(value) {
    return value && typeof value === "object" && "ref" in value ? value.ref : null;
}

function refList(value) {
    if (!Array.isArray(value)) {
        const id = refId(value);
        return id == null ? [] : [id];
    }
    return value.map(refId).filter((id) => id != null);
}

function cell(value) {
    if (value == null || value === "") {
        return "";
    }
    if (typeof value === "boolean") {
        return value ? "TRUE" : "FALSE";
    }
    const text = String(value);
    if (/[",\r\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function propertyValue(nominal) {
    if (nominal === "T") {
        return true;
    }
    if (nominal === "F") {
        return false;
    }
    return nominal;
}

const entities = parseEntities(fs.readFileSync(ifcPath, "utf8"));
const psets = new Map();
const propsOn = new Map();
const typeOf = new Map();
const storeyOf = new Map();
const materialOf = new Map();

for (const [id, entity] of entities) {
    if (entity.name === "IFCPROPERTYSET") {
        const propIds = refList(entity.args[4]);
        const props = {};
        for (const propId of propIds) {
            const prop = entities.get(propId);
            if (!prop || prop.name !== "IFCPROPERTYSINGLEVALUE") {
                continue;
            }
            props[prop.args[0]] = propertyValue(prop.args[2]);
        }
        psets.set(id, { name: entity.args[2] || `Pset_${id}`, props });
    }
}

function addProps(targetId, psetId, override) {
    const pset = psets.get(psetId);
    if (!pset) {
        return;
    }
    if (!propsOn.has(targetId)) {
        propsOn.set(targetId, {});
    }
    const bag = propsOn.get(targetId);
    for (const [key, value] of Object.entries(pset.props)) {
        const column = `${pset.name}.${key}`;
        if (override || bag[column] == null) {
            bag[column] = value;
        }
    }
}

for (const entity of entities.values()) {
    if (entity.name !== "IFCRELDEFINESBYPROPERTIES") {
        continue;
    }
    const objects = refList(entity.args[4]);
    const psetId = refId(entity.args[5]);
    for (const objectId of objects) {
        addProps(objectId, psetId, true);
    }
}

for (const entity of entities.values()) {
    if (entity.name !== "IFCRELDEFINESBYTYPE") {
        continue;
    }
    const objects = refList(entity.args[4]);
    const typeId = refId(entity.args[5]);
    for (const objectId of objects) {
        typeOf.set(objectId, typeId);
        const inherited = propsOn.get(typeId) || {};
        if (!propsOn.has(objectId)) {
            propsOn.set(objectId, {});
        }
        const bag = propsOn.get(objectId);
        for (const [column, value] of Object.entries(inherited)) {
            if (bag[column] == null) {
                bag[column] = value;
            }
        }
    }
}

for (const entity of entities.values()) {
    if (entity.name === "IFCRELCONTAINEDINSPATIALSTRUCTURE") {
        const storey = entities.get(refId(entity.args[5]));
        const storeyName = storey ? storey.args[2] : "";
        for (const objectId of refList(entity.args[4])) {
            storeyOf.set(objectId, storeyName || "");
        }
    }
    if (entity.name === "IFCRELASSOCIATESMATERIAL") {
        const material = entities.get(refId(entity.args[5]));
        const materialName = material && material.name === "IFCMATERIAL" ? material.args[0] : "";
        for (const objectId of refList(entity.args[4])) {
            if (materialName) {
                materialOf.set(objectId, materialName);
            }
        }
    }
}

for (const [objectId, typeId] of typeOf) {
    if (!materialOf.has(objectId) && materialOf.has(typeId)) {
        materialOf.set(objectId, materialOf.get(typeId));
    }
}

const rows = [];
const columns = new Set();
for (const [id, entity] of entities) {
    if (!ELEMENT_TYPES.has(entity.name)) {
        continue;
    }
    const props = propsOn.get(id) || {};
    Object.keys(props).forEach((column) => columns.add(column));
    rows.push({
        id,
        globalId: entity.args[0] || "",
        name: entity.args[2] || "",
        type: TYPE_LABEL[entity.name] || entity.name,
        objectType: entity.args[4] || "",
        tag: entity.args[7] || "",
        predefinedType: entity.args[8] || "",
        storey: storeyOf.get(id) || "",
        material: materialOf.get(id) || "",
        props
    });
}

rows.sort((a, b) => String(a.globalId).localeCompare(String(b.globalId)));
const propColumns = [...columns].sort();
const header = [
    "Object ID",
    "Name",
    "Type",
    "Object Type",
    "Tag",
    "Predefined Type",
    "Storey",
    "Material",
    ...propColumns
];

const lines = [header.map(cell).join(",")];
for (const row of rows) {
    lines.push([
        row.globalId,
        row.name,
        row.type,
        row.objectType,
        row.tag,
        row.predefinedType,
        row.storey,
        row.material,
        ...propColumns.map((column) => row.props[column])
    ].map(cell).join(","));
}

fs.writeFileSync(csvPath, `\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
console.log(`Wrote ${rows.length} elements to ${csvPath}`);
console.log(`Columns: ${header.join(" | ")}`);
