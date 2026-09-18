"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;
import Slice = formattingSettings.Slice;

class MapCard extends Card {
    centerLat = new formattingSettings.NumUpDown({
        name: "centerLat",
        displayName: "Center latitude",
        value: 20
    });
    centerLng = new formattingSettings.NumUpDown({
        name: "centerLng",
        displayName: "Center longitude",
        value: 0
    });
    zoom = new formattingSettings.NumUpDown({
        name: "zoom",
        displayName: "Zoom",
        value: 2
    });
    minZoom = new formattingSettings.NumUpDown({
        name: "minZoom",
        displayName: "Min zoom",
        value: 0
    });
    maxZoom = new formattingSettings.NumUpDown({
        name: "maxZoom",
        displayName: "Max zoom",
        value: 19
    });
    zoomSnap = new formattingSettings.NumUpDown({
        name: "zoomSnap",
        displayName: "Zoom snap",
        value: 1
    });
    zoomDelta = new formattingSettings.NumUpDown({
        name: "zoomDelta",
        displayName: "Zoom delta",
        value: 1
    });
    fitToData = new formattingSettings.ToggleSwitch({
        name: "fitToData",
        displayName: "Fit to data",
        value: true
    });
    preferCanvas = new formattingSettings.ToggleSwitch({
        name: "preferCanvas",
        displayName: "Prefer canvas renderer",
        value: false
    });
    crs = new formattingSettings.AutoDropdown({
        name: "crs",
        displayName: "CRS",
        value: "EPSG3857"
    });

    name = "map";
    displayName = "Map";
    slices: Slice[] = [
        this.centerLat, this.centerLng, this.zoom, this.minZoom, this.maxZoom,
        this.zoomSnap, this.zoomDelta, this.fitToData, this.preferCanvas, this.crs
    ];
}

class InteractionCard extends Card {
    dragging = new formattingSettings.ToggleSwitch({ name: "dragging", displayName: "Dragging", value: true });
    scrollWheelZoom = new formattingSettings.ToggleSwitch({ name: "scrollWheelZoom", displayName: "Scroll wheel zoom", value: true });
    doubleClickZoom = new formattingSettings.ToggleSwitch({ name: "doubleClickZoom", displayName: "Double-click zoom", value: true });
    boxZoom = new formattingSettings.ToggleSwitch({ name: "boxZoom", displayName: "Shift-drag box zoom", value: true });
    keyboard = new formattingSettings.ToggleSwitch({ name: "keyboard", displayName: "Keyboard navigation", value: true });
    zoomControl = new formattingSettings.ToggleSwitch({ name: "zoomControl", displayName: "Zoom control", value: true });
    scaleControl = new formattingSettings.ToggleSwitch({ name: "scaleControl", displayName: "Scale control", value: true });
    layersControl = new formattingSettings.ToggleSwitch({ name: "layersControl", displayName: "Layers control", value: true });
    crossFilter = new formattingSettings.ToggleSwitch({ name: "crossFilter", displayName: "Cross-filter on click", value: true });

    name = "interaction";
    displayName = "Interaction";
    slices: Slice[] = [
        this.dragging, this.scrollWheelZoom, this.doubleClickZoom, this.boxZoom,
        this.keyboard, this.zoomControl, this.scaleControl, this.layersControl, this.crossFilter
    ];
}

class BasemapCard extends Card {
    provider = new formattingSettings.AutoDropdown({
        name: "provider",
        displayName: "Provider",
        value: "esriStreet"
    });
    opacity = new formattingSettings.NumUpDown({
        name: "opacity",
        displayName: "Opacity",
        value: 1
    });
    tms = new formattingSettings.ToggleSwitch({
        name: "tms",
        displayName: "TMS Y-axis",
        value: false
    });

    name = "basemap";
    displayName = "Basemap";
    slices: Slice[] = [this.provider, this.opacity, this.tms];
}

class WmsCard extends Card {
    show = new formattingSettings.ToggleSwitch({ name: "show", displayName: "Show WMS", value: false });
    url = new formattingSettings.TextInput({
        name: "url",
        displayName: "WMS URL",
        value: "https://ows.mundialis.de/services/service?",
        placeholder: "https://example.com/wms?"
    });
    layers = new formattingSettings.TextInput({
        name: "layers",
        displayName: "WMS layers",
        value: "TOPO-OSM-WMS",
        placeholder: "layer1,layer2"
    });
    styles = new formattingSettings.TextInput({
        name: "styles",
        displayName: "WMS styles",
        value: "",
        placeholder: "optional"
    });
    format = new formattingSettings.TextInput({
        name: "format",
        displayName: "Image format",
        value: "image/png",
        placeholder: "image/png"
    });
    transparent = new formattingSettings.ToggleSwitch({ name: "transparent", displayName: "Transparent", value: true });
    version = new formattingSettings.TextInput({
        name: "version",
        displayName: "WMS version",
        value: "1.1.1",
        placeholder: "1.1.1"
    });
    opacity = new formattingSettings.NumUpDown({ name: "opacity", displayName: "Opacity", value: 0.85 });
    uppercase = new formattingSettings.ToggleSwitch({ name: "uppercase", displayName: "Uppercase params", value: false });
    asBasemap = new formattingSettings.ToggleSwitch({ name: "asBasemap", displayName: "Use as base layer", value: false });

    name = "wms";
    displayName = "WMS layer";
    slices: Slice[] = [
        this.show, this.url, this.layers, this.styles, this.format,
        this.transparent, this.version, this.opacity, this.uppercase, this.asBasemap
    ];
}

class GeoJsonCard extends Card {
    url = new formattingSettings.TextInput({
        name: "url",
        displayName: "GeoJSON URL",
        value: "",
        placeholder: "https://example.com/data.geojson"
    });
    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Stroke / fill",
        value: { value: "#3388ff" }
    });
    weight = new formattingSettings.NumUpDown({ name: "weight", displayName: "Stroke weight", value: 2 });
    fillOpacity = new formattingSettings.NumUpDown({ name: "fillOpacity", displayName: "Fill opacity", value: 0.45 });
    highlight = new formattingSettings.ToggleSwitch({ name: "highlight", displayName: "Highlight on hover", value: true });
    zoomOnClick = new formattingSettings.ToggleSwitch({ name: "zoomOnClick", displayName: "Zoom to feature on click", value: true });
    choropleth = new formattingSettings.ToggleSwitch({ name: "choropleth", displayName: "Choropleth from Color by", value: true });

    name = "geojson";
    displayName = "GeoJSON layer";
    slices: Slice[] = [
        this.url, this.color, this.weight, this.fillOpacity,
        this.highlight, this.zoomOnClick, this.choropleth
    ];
}

class ShapefileCard extends Card {
    url = new formattingSettings.TextInput({
        name: "url",
        displayName: "Shapefile URL (.zip or .shp)",
        value: "",
        placeholder: "https://example.com/layer.zip"
    });
    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Stroke / fill",
        value: { value: "#e31a1c" }
    });
    weight = new formattingSettings.NumUpDown({ name: "weight", displayName: "Stroke weight", value: 2 });
    fillOpacity = new formattingSettings.NumUpDown({ name: "fillOpacity", displayName: "Fill opacity", value: 0.4 });

    name = "shapefile";
    displayName = "Shapefile layer";
    slices: Slice[] = [this.url, this.color, this.weight, this.fillOpacity];
}

class PointsCard extends Card {
    radius = new formattingSettings.NumUpDown({ name: "radius", displayName: "Radius (px)", value: 8 });
    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Color",
        value: { value: "#1f77b4" }
    });
    fillOpacity = new formattingSettings.NumUpDown({ name: "fillOpacity", displayName: "Fill opacity", value: 0.8 });
    weight = new formattingSettings.NumUpDown({ name: "weight", displayName: "Stroke weight", value: 1 });

    name = "points";
    displayName = "Point markers";
    slices: Slice[] = [this.radius, this.color, this.fillOpacity, this.weight];
}

class ImageOverlayCard extends Card {
    url = new formattingSettings.TextInput({
        name: "url",
        displayName: "Image URL",
        value: "",
        placeholder: "https://example.com/overlay.png"
    });
    north = new formattingSettings.NumUpDown({ name: "north", displayName: "North", value: 0 });
    south = new formattingSettings.NumUpDown({ name: "south", displayName: "South", value: 0 });
    east = new formattingSettings.NumUpDown({ name: "east", displayName: "East", value: 0 });
    west = new formattingSettings.NumUpDown({ name: "west", displayName: "West", value: 0 });
    opacity = new formattingSettings.NumUpDown({ name: "opacity", displayName: "Opacity", value: 0.7 });

    name = "imageOverlay";
    displayName = "Image overlay";
    slices: Slice[] = [this.url, this.north, this.south, this.east, this.west, this.opacity];
}

export class VisualFormattingSettingsModel extends Model {
    map = new MapCard();
    interaction = new InteractionCard();
    basemap = new BasemapCard();
    wms = new WmsCard();
    geojson = new GeoJsonCard();
    shapefile = new ShapefileCard();
    points = new PointsCard();
    imageOverlay = new ImageOverlayCard();

    cards = [
        this.map, this.interaction, this.basemap, this.wms,
        this.geojson, this.shapefile, this.points, this.imageOverlay
    ];
}
