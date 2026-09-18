"use strict";

import powerbi from "powerbi-visuals-api";

type DescriptorLike = {
    selector?: powerbi.data.Selector | null;
};

function patchDescriptor(descriptor: DescriptorLike | undefined): void {
    if (descriptor) {
        descriptor.selector = null;
    }
}

function patchControl(control: { properties?: Record<string, unknown> } | undefined): void {
    const properties = control?.properties;
    if (!properties) {
        return;
    }
    patchDescriptor(properties.descriptor as DescriptorLike | undefined);
    for (const value of Object.values(properties)) {
        if (value && typeof value === "object" && "descriptor" in value) {
            patchDescriptor(value as DescriptorLike);
        }
    }
}

export function forceNullSelectors(model: powerbi.visuals.FormattingModel): powerbi.visuals.FormattingModel {
    for (const card of model.cards) {
        if (!("groups" in card) || !card.groups) {
            continue;
        }
        const formattingCard = card as powerbi.visuals.FormattingCard;
        if (formattingCard.topLevelToggle) {
            patchControl(formattingCard.topLevelToggle.control as unknown as { properties?: Record<string, unknown> });
        }
        for (const group of formattingCard.groups) {
            if (!("slices" in group)) {
                continue;
            }
            const formattingGroup = group as powerbi.visuals.FormattingGroup;
            if (formattingGroup.topLevelToggle) {
                patchControl(formattingGroup.topLevelToggle.control as unknown as { properties?: Record<string, unknown> });
            }
            for (const slice of formattingGroup.slices || []) {
                if ("control" in slice) {
                    patchControl(slice.control as unknown as { properties?: Record<string, unknown> });
                }
            }
        }
    }
    return model;
}
