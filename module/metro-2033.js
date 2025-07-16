// Import Modules
import { MYZ } from "./config.js";
import { registerSystemSettings } from "./settings.js";
import MYZHooks from "./MYZHooks.js";
import { MYZActor } from "./actor/actor.js";
import { MYZMutantSheet } from "./actor/mutant-sheet.js";
import { MYZActorSheet } from "./actor/actor-sheet.js";
import { MYZPJSheet } from "./actor/pj-sheet.js";
import { MYZPNJSheet } from "./actor/pnj-sheet.js";
import {MYZVehicleSheet} from "./actor/vehicle-sheet.js";
import {MYZStationSheet} from "./actor/station-sheet.js";
import { MYZItem } from "./item/item.js";
import { MYZItemSheet } from "./item/item-sheet.js";
import { MYZDieBase } from "./MYZDice.js";
import { MYZDieSkill } from "./MYZDice.js";
import { MYZDieGear } from "./MYZDice.js";

import { DiceRoller } from "./component/dice-roller.js";
import { RollDialog } from "./app/roll-dialog.js";


//import * as migrations from "./migration.js";

/* ------------------------------------ */
/* Setup MYZ system	 */
/* ------------------------------------ */

Hooks.once("init", async function () {
    game.myz = {
        MYZ,
        MYZActor,
        MYZMutantSheet,
        MYZPJSheet,
        MYZPNJSheet,
        MYZVehicleSheet,
        MYZStationSheet,
        rollItemMacro,
        DiceRoller,
        RollDialog,
    };
    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "1d6 + (@attributes.agility.value/10)",
        decimals: 1,
    };

    // Define custom Entity classes
    CONFIG.MYZ = MYZ;
    CONFIG.Actor.documentClass = MYZActor;
    CONFIG.Item.documentClass = MYZItem;
    //CONFIG.diceRoller = DiceRoller;

    CONFIG.roller = new DiceRoller();

    CONFIG.Dice.terms["b"] = MYZDieBase;
    CONFIG.Dice.terms["s"] = MYZDieSkill;
    CONFIG.Dice.terms["g"] = MYZDieGear;

    CONFIG.TextEditor.enrichers = CONFIG.TextEditor.enrichers.concat([
        {
          pattern : /@myz\[(.+?)\]/gm,
          enricher : async (match, options) => {
              const span = document.createElement("span");
              span.style.fontFamily = "myz"
              if(match[1]=="s"){
                span.innerHTML = `A`
              }
              else if(match[1]=="f"){
                span.innerHTML = `B`
              }
              else if(match[1]=="g"){
                span.innerHTML = `C`
              }
              return span;
          }
        }
      ])

    // Register System Settings
    registerSystemSettings();

    // Register sheet application classes
    foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
    foundry.documents.collections.Actors.registerSheet("metro-2033", MYZMutantSheet, {
        types: ["mutant"],
        makeDefault: true,
    });
    foundry.documents.collections.Actors.registerSheet("metro-2033", MYZPJSheet, {
        types: ["pj"],
        makeDefault: true,
    });
    foundry.documents.collections.Actors.registerSheet("metro-2033", MYZPNJSheet, {
        types: ["pnj"],
        makeDefault: true,
    });
    foundry.documents.collections.Actors.registerSheet("metro-2033", MYZVehicleSheet, {
        types: ["vehicle"],
        makeDefault: true,
    });
    foundry.documents.collections.Actors.registerSheet("metro-2033", MYZStationSheet, {
        types: ["station"],
        makeDefault: true,
    });
    foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
    foundry.documents.collections.Items.registerSheet("metro-2033", MYZItemSheet, { makeDefault: true });

    /* -------------------------------------------- */
    /*  HANDLEBARS HELPERS      */
    /* -------------------------------------------- */

    _preloadHandlebarsTemplates();

    Handlebars.registerHelper("concat", function () {
        var outStr = "";
        for (var arg in arguments) {
            if (typeof arguments[arg] != "object") {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper("weaponCategory", function (category) {
        category = normalize(category, "melee");
        switch (category) {
            case "melee":
                return game.i18n.localize("MYZ.WEAPON_MELEE");
            case "ranged":
                return game.i18n.localize("MYZ.WEAPON_RANGED");
        }
    });

    Handlebars.registerHelper("armorPart", function (part) {
        part = normalize(part, "armor");
        switch (part) {
            case "armor":
                return game.i18n.localize("MYZ.ARMOR_BODY");
            case "shield":
                return game.i18n.localize("MYZ.ARMOR_SHIELD");
        }
    });

    Handlebars.registerHelper("isBroken", function (item) {
        let bonus = 0;
        let max = 0;
        if (item.type == "weapon") {
            bonus = item.system.bonus.value;
            max = item.system.bonus.max;
        } else if (item.type == "armor") {
            bonus = item.system.rating.value;
            max = item.system.rating.max;
        } else {
            return false;
        }
        if (parseInt(max, 10) > 0 && parseInt(bonus, 10) === 0) {
            return "broken";
        } else {
            return "";
        }
    });

    Handlebars.registerHelper("isArtifact", function (item) {
        if (item.system.dev_requirement != "" || item.system.dev_bonus != "") {
            return true;
        }
        return false;
    });

    Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
        switch (operator) {
            case "==":
                return v1 == v2 ? options.fn(this) : options.inverse(this);
            case "===":
                return v1 === v2 ? options.fn(this) : options.inverse(this);
            case "!=":
                return v1 != v2 ? options.fn(this) : options.inverse(this);
            case "!==":
                return v1 !== v2 ? options.fn(this) : options.inverse(this);
            case "<":
                return v1 < v2 ? options.fn(this) : options.inverse(this);
            case "<=":
                return v1 <= v2 ? options.fn(this) : options.inverse(this);
            case ">":
                return v1 > v2 ? options.fn(this) : options.inverse(this);
            case ">=":
                return v1 >= v2 ? options.fn(this) : options.inverse(this);
            case "&&":
                return v1 && v2 ? options.fn(this) : options.inverse(this);
            case "||":
                return v1 || v2 ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    });

    Handlebars.registerHelper("math", function (lvalue, operator, rvalue, options) {
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);

        return {
            "+": lvalue + rvalue,
            "-": lvalue - rvalue,
            "*": lvalue * rvalue,
            "/": lvalue / rvalue,
            "%": lvalue % rvalue
        }[operator];
    });

    Handlebars.registerHelper("trimString3", function (passedString) {
        var theString = passedString.substring(0, 3);
        return new Handlebars.SafeString(theString);
    });

    Handlebars.registerHelper("createLocalizationString", function () {
        let fullString = "";
        for (var i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] === "string" || arguments[i] instanceof String) {
                fullString += arguments[i];
                if (i + 2 < arguments.length) {
                    fullString += "_";
                }
            }
        }
        return fullString.toUpperCase();
    });

    Handlebars.registerHelper("toLowerCase", function (str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper("toUpperCase", function (str) {
        return str.toUpperCase();
    });

    Handlebars.registerHelper("isdefined", function (value) {
        return value !== undefined;
    });

    Handlebars.registerHelper("ifvalue", function (condition, value) {
        return condition == value;
    });

    Handlebars.registerHelper("greaterThan", function (val1, val2) {
        return val1 > val2;
    });

    Handlebars.registerHelper("substract", function (val1, val2) {
        return val1 - val2;
    });

    Handlebars.registerHelper("getAbilitiesTypeName", function (val) {
        if(val=="mutant"){
            return "MYZ.MUTATIONS"
        }else if(val=="animal"){
            return "MYZ.ANIMAL_POWERS"
        }else if(val=="robot"){
            return "MYZ.MODULES"
        }else if(val=="human"){
            return "MYZ.CONTACTS"
        }else{ return ""}
    });

    Handlebars.registerHelper('anyDefined', function() {
        const options = arguments[arguments.length - 1];
        // Exclude the last argument (Handlebars options object)
        return Array.prototype.slice.call(arguments, 0, -1).some(v => v !== undefined && v !== null);
        });

});

// LOAD STUNTS
Hooks.on("init", async function(){
    const stuntJSON = game.settings.get('metro-2033','stuntsJSON')
    const jsonFile = await fetch(stuntJSON)
    const content = await jsonFile.json();
    CONFIG.MYZ.STUNTS = content;
})

// CHECK MIGRATIOM
Hooks.once("ready", async function () {
    // Determine whether a system migration is required and feasible
    const currentVersion = game.settings.get("metro-2033", "systemMigrationVersion");
    const NEEDS_MIGRATION_VERSION = 0.95;
    const COMPATIBLE_MIGRATION_VERSION = 0.5;
    let needMigration = currentVersion < NEEDS_MIGRATION_VERSION || currentVersion === null;

    // ! Perform the migration
    if (needMigration && game.user.isGM) {
        if (currentVersion && currentVersion < COMPATIBLE_MIGRATION_VERSION) {
            ui.notifications.error(
                `Your MYZ system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`,
                { permanent: true }
            );
        }
        // UNCOMMENT import * as migrations from "./migration.js";
        // CALL migrations.migrateWorld(); in future if you need migration and delete two lines bellow since they are contained in the migrations.migrateWorld();
        //migrations.migrateWorld();
        game.settings.set("metro-2033", "systemMigrationVersion", game.system.version);
        ui.notifications.info(`MYZ System Migration to version ${game.system.version} completed!`, { permanent: true });
    }
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    //Hooks.on("hotbarDrop", (bar, data, slot) => createMYZMacro(data, slot));
});

/* SET CHARACTER TYPE */
/* POPULATE CHARACTER WITH DEFAULT SKILLS */
Hooks.on("createActor", async (actor, options, userId) => MYZHooks.onCreateActor(actor, options, userId));
Hooks.on("preCreateItem", MYZHooks.onPreCreateItem);
Hooks.on("preUpdateItem", MYZHooks.onUpdateOwnedItem);

Hooks.on("renderChatMessage", (message, html, data)=>{
    if(message.isAuthor || game.user.isGM){
        html.find('.push-button').click((ev)=>{
            ev.stopImmediatePropagation();
            ev.preventDefault();
            DiceRoller.Push(message, html, data);
        });
    }else{
        html.find('.push-button').remove();
    }

    html.find('.modifiers-trigger').click((ev)=>{
        html.find('.modifiers').toggle(200)
    });

    html.find('.stunts-trigger').click((ev)=>{
        html.find('.stunts').toggle(200)
    });
})

/* -------------------------------------------- */
/*  DsN Hooks                                   */
/* -------------------------------------------- */

Hooks.on("diceSoNiceRollComplete", (chatMessageID) => { });

Hooks.once("diceSoNiceReady", (dice3d) => {
    dice3d.addColorset({
        name: "yellow",
        description: "Yellow",
        category: "Colors",
        foreground: "#b1990f",
        background: "#b1990f",
        outline: "#b1990f",
        texture: "none",
    });
    dice3d.addColorset({
        name: "green",
        description: "Green",
        category: "Colors",
        foreground: "#00810a",
        background: "#00810a",
        outline: "#00810a",
        texture: "none",
    });

    dice3d.addSystem({ id: "metro-2033", name: "Mutant Year Zero" }, true);
    dice3d.addDicePreset({
        type: "db",
        labels: [
            "systems/metro-2033/ui/dice/b1.png",
            "systems/metro-2033/ui/dice/b2.png",
            "systems/metro-2033/ui/dice/b3.png",
            "systems/metro-2033/ui/dice/b4.png",
            "systems/metro-2033/ui/dice/b5.png",
            "systems/metro-2033/ui/dice/b6.png",
        ],
        colorset: "yellow",
        system: "metro-2033",
    });
    dice3d.addDicePreset({
        type: "ds",
        labels: [
            "systems/metro-2033/ui/dice/s1.png",
            "systems/metro-2033/ui/dice/s2.png",
            "systems/metro-2033/ui/dice/s3.png",
            "systems/metro-2033/ui/dice/s4.png",
            "systems/metro-2033/ui/dice/s5.png",
            "systems/metro-2033/ui/dice/s6.png",
        ],
        colorset: "green",
        system: "metro-2033",
    });
    dice3d.addDicePreset({
        type: "dg",
        labels: [
            "systems/metro-2033/ui/dice/g1.png",
            "systems/metro-2033/ui/dice/g2.png",
            "systems/metro-2033/ui/dice/g3.png",
            "systems/metro-2033/ui/dice/g4.png",
            "systems/metro-2033/ui/dice/g5.png",
            "systems/metro-2033/ui/dice/g6.png",
        ],
        colorset: "black",
        system: "metro-2033",
    });
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createMYZMacro(data, slot) {
    //ui.notifications.warn("DRAGGING ITEMS WILL BE IMPLEMENTED IN THE FUTURE");
    return;
    if (data.type !== "Item") return;
    if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
    const item = data.data;

    // Create the macro command
    const command = `game.metro-2033.rollItemMacro("${item.name}");`;
    let macro = game.macros.entities.find((m) => m.name === item.name && m.command === command);
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: { "metro-2033.itemMacro": true },
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find((i) => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

    // Trigger the item roll
    return item.roll();
}

/* -------------------------------------------- */
/** LOAD PARTIALS
/* -------------------------------------------- */

function _preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/metro-2033/templates/actor/partials/character-header.html",
        "systems/metro-2033/templates/actor/partials/attributes.html",
        "systems/metro-2033/templates/actor/partials/conditions.html",
        "systems/metro-2033/templates/actor/partials/criticals.html",
        "systems/metro-2033/templates/actor/partials/rot.html",
        "systems/metro-2033/templates/actor/partials/skills.html",
        "systems/metro-2033/templates/actor/partials/weapons.html",
        "systems/metro-2033/templates/actor/partials/armors.html",
        "systems/metro-2033/templates/actor/partials/chassis.html",
        "systems/metro-2033/templates/actor/partials/chassis-1row.html",
        "systems/metro-2033/templates/actor/partials/gear.html",
        "systems/metro-2033/templates/actor/partials/artifacts.html",
        "systems/metro-2033/templates/actor/partials/resource-counter.html",
        "systems/metro-2033/templates/actor/partials/abilities.html",
        "systems/metro-2033/templates/actor/partials/talents.html",
        "systems/metro-2033/templates/actor/partials/info.html",
        "systems/metro-2033/templates/actor/partials/consumables.html",
        "systems/metro-2033/templates/actor/partials/encumbrance.html",
        "systems/metro-2033/templates/actor/partials/actor-effects.html",
        "systems/metro-2033/templates/actor/partials/special.html",
        "systems/metro-2033/templates/actor/partials/npc-inventory.html",
        "systems/metro-2033/templates/item/partials/header-simple.html",
        "systems/metro-2033/templates/item/partials/header-physical.html",
        "systems/metro-2033/templates/item/partials/tabs.html",
        "systems/metro-2033/templates/item/partials/modifiers.html",
        "systems/metro-2033/templates/item/partials/dev-levels.html"

    ];
    return foundry.applications.handlebars.loadTemplates(templatePaths);
}

function normalize(data, defaultValue) {
    if (data) {
        return data.toLowerCase();
    } else {
        return defaultValue;
    }
}
