import { MYZActorSheet } from "./actor-sheet.js";

export class MYZMutantSheet extends MYZActorSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["metro-2033", "sheet", "actor"],
            template: "systems/metro-2033/templates/actor/mutant-sheet.html",
            width: 720,
            height: 720,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
        });
    }
}
