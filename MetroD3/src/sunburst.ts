"use strict";

import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import { VisualFormattingSettingsModel } from "./settings";
import { collectIdentities, TreeNode } from "./dataView";

import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;

type ArcPoint = { x0: number; x1: number; y0: number; y1: number };
type SunburstNode = d3.HierarchyRectangularNode<TreeNode> & {
    current: ArcPoint;
    target?: ArcPoint;
};

export class SunburstController {
    private readonly statusEl: HTMLElement;
    private readonly centerEl: HTMLElement;
    private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined;
    private loadedSignature = "";

    constructor(
        private readonly hostElement: HTMLElement,
        private readonly selectionManager: ISelectionManager,
        private readonly allowInteractions: () => boolean,
        version: string
    ) {
        this.hostElement.classList.add("metrod3-host");

        this.centerEl = document.createElement("div");
        this.centerEl.className = "metrod3-center";
        this.hostElement.appendChild(this.centerEl);

        this.statusEl = document.createElement("div");
        this.statusEl.className = "metrod3-status";
        this.hostElement.appendChild(this.statusEl);

        const versionEl = document.createElement("div");
        versionEl.className = "metrod3-version";
        versionEl.textContent = `MetroD3 ${version}`;
        this.hostElement.appendChild(versionEl);
    }

    public resize(): void {
        // SVG uses viewBox; CSS stretches it to the host.
    }

    public destroy(): void {
        this.svg?.remove();
        this.svg = undefined;
    }

    public render(settings: VisualFormattingSettingsModel, root: TreeNode): void {
        const scheme = String(settings.appearance.colorScheme.value || "rainbow");
        const showLabels = Boolean(settings.chart.showLabels.value);
        const fontSize = Number(settings.appearance.fontSize.value) || 10;
        const signature = [root.name, scheme, showLabels, fontSize, treeSignature(root)].join("|");
        this.hostElement.style.background = settings.appearance.background.value.value || "#ffffff";

        if (signature === this.loadedSignature && this.svg) {
            this.setStatus("");
            return;
        }
        this.loadedSignature = signature;
        this.draw(settings, root);
        this.setStatus("");
    }

    public setStatus(message: string): void {
        this.statusEl.textContent = message;
        this.statusEl.style.display = message ? "block" : "none";
    }

    private draw(settings: VisualFormattingSettingsModel, data: TreeNode): void {
        this.svg?.remove();

        const width = 928;
        const radius = width / 6;
        const duration = Math.max(0, Number(settings.chart.duration.value) || 750);
        const fontSize = Math.max(8, Number(settings.appearance.fontSize.value) || 10);
        const showLabels = Boolean(settings.chart.showLabels.value);
        const color = colorScale(settings.appearance.colorScheme.value as string, data);

        const hierarchy = d3.hierarchy(data)
            .sum((d) => d.value || 0)
            .sort((a, b) => (b.value || 0) - (a.value || 0));
        const root = d3.partition<TreeNode>()
            .size([2 * Math.PI, hierarchy.height + 1])(hierarchy) as SunburstNode;
        root.each((d) => {
            (d as SunburstNode).current = d;
        });

        const arc = d3.arc<ArcPoint>()
            .startAngle((d) => d.x0)
            .endAngle((d) => d.x1)
            .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius * 1.5)
            .innerRadius((d) => d.y0 * radius)
            .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

        const svg = d3.create("svg")
            .attr("viewBox", `${-width / 2} ${-width / 2} ${width} ${width}`)
            .attr("width", "100%")
            .attr("height", "100%")
            .style("font", `${fontSize}px sans-serif`);
        this.svg = svg;
        this.hostElement.insertBefore(svg.node() as SVGSVGElement, this.centerEl);

        const path = svg.append("g")
            .selectAll("path")
            .data(root.descendants().slice(1) as SunburstNode[])
            .join("path")
            .attr("fill", (d) => {
                let node: SunburstNode | null = d;
                while (node && node.depth > 1) {
                    node = node.parent as SunburstNode | null;
                }
                return color(node?.data.name || d.data.name);
            })
            .attr("fill-opacity", (d) => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
            .attr("pointer-events", (d) => arcVisible(d.current) ? "auto" : "none")
            .attr("d", (d) => arc(d.current));

        path.style("cursor", "pointer")
            .on("click", (event: MouseEvent, p: SunburstNode) => {
                if (!this.allowInteractions()) {
                    return;
                }
                if (p.children) {
                    clicked(event, p);
                }
                this.applySelection(settings, p.data);
            });

        const format = d3.format(",d");
        path.append("title")
            .text((d) => {
                const pathLabel = d.ancestors().map((node) => node.data.name).reverse().join("/");
                const extra = (d.data.tooltips || []).map(([k, v]) => `${k}: ${v}`).join("\n");
                return extra ? `${pathLabel}\n${format(d.value || 0)}\n${extra}` : `${pathLabel}\n${format(d.value || 0)}`;
            });

        const label = svg.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none")
            .selectAll("text")
            .data(root.descendants().slice(1) as SunburstNode[])
            .join("text")
            .attr("dy", "0.35em")
            .attr("fill-opacity", (d) => showLabels ? +labelVisible(d.current) : 0)
            .attr("transform", (d) => labelTransform(d.current, radius))
            .text((d) => d.data.name);

        const parent = svg.append("circle")
            .datum(root)
            .attr("r", radius)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .style("cursor", "pointer")
            .on("click", (event: MouseEvent, p: SunburstNode) => {
                if (!this.allowInteractions()) {
                    return;
                }
                clicked(event, p);
                if (p === root) {
                    void this.selectionManager.clear();
                } else {
                    this.applySelection(settings, p.data);
                }
            });

        this.centerEl.textContent = data.name;

        const self = this;
        function clicked(event: MouseEvent, p: SunburstNode): void {
            parent.datum(p.parent || root);
            self.centerEl.textContent = p.data.name;

            root.each((d) => {
                const node = d as SunburstNode;
                node.target = {
                    x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                    x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                    y0: Math.max(0, d.y0 - p.depth),
                    y1: Math.max(0, d.y1 - p.depth)
                };
            });

            const t = svg.transition().duration(event.altKey ? duration * 10 : duration);

            path.transition(t)
                .tween("data", (d) => {
                    const i = d3.interpolate(d.current, d.target as ArcPoint);
                    return (time) => { d.current = i(time); };
                })
                .filter(function (d) {
                    const el = this as Element;
                    return Boolean(+(el.getAttribute("fill-opacity") || 0) || arcVisible(d.target as ArcPoint));
                })
                .attr("fill-opacity", (d) => arcVisible(d.target as ArcPoint) ? (d.children ? 0.6 : 0.4) : 0)
                .attr("pointer-events", (d) => arcVisible(d.target as ArcPoint) ? "auto" : "none")
                .attrTween("d", (d) => () => arc(d.current) || "");

            label.filter(function (d) {
                const el = this as Element;
                return Boolean(+(el.getAttribute("fill-opacity") || 0) || labelVisible(d.target as ArcPoint));
            }).transition(t)
                .attr("fill-opacity", (d) => showLabels ? +labelVisible(d.target as ArcPoint) : 0)
                .attrTween("transform", (d) => () => labelTransform(d.current, radius));
        }
    }

    private applySelection(settings: VisualFormattingSettingsModel, node: TreeNode): void {
        if (!settings.selection.crossFilter.value) {
            return;
        }
        const ids: ISelectionId[] = collectIdentities(node);
        if (!ids.length) {
            return;
        }
        void this.selectionManager.select(ids.length === 1 ? ids[0] : ids, false);
    }
}

function arcVisible(d: ArcPoint): boolean {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
}

function labelVisible(d: ArcPoint): boolean {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
}

function labelTransform(d: ArcPoint, radius: number): string {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
}

function colorScale(scheme: string, data: TreeNode): d3.ScaleOrdinal<string, string> {
    const names = (data.children || []).map((child) => child.name);
    if (scheme === "tableau") {
        return d3.scaleOrdinal(d3.schemeTableau10).domain(names);
    }
    if (scheme === "category10") {
        return d3.scaleOrdinal(d3.schemeCategory10).domain(names);
    }
    return d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, names.length + 1)).domain(names);
}

function treeSignature(node: TreeNode): string {
    const kids = (node.children || []).map(treeSignature).join(",");
    return `${node.name}:${node.value || 0}[${kids}]`;
}
