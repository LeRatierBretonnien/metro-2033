import { MYZActorSheet } from "./actor-sheet.js";

export class MYZPNJSheet extends MYZActorSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["metro-2033", "sheet", "actor"],
            template: "systems/metro-2033/templates/actor/pnj-sheet.html",
            width: 600,
            height: 615,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
        });
    }
}
