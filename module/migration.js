/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs
 * @return {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld = async function () {
    ui.notifications.info(
        `Applying MYZ System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`,
        { permanent: true }
    );
    /*
    // Migrate World Actors
    for (let a of game.actors.entities) {
        try {
            const updateData = migrateActorData(a.data);
            if (!isObjectEmpty(updateData)) {
                console.log(`Migrating Actor entity ${a.name}`);
                await a.update(updateData, { enforceTypes: false });
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Migrate World Items
    for (let i of game.items.entities) {
        try {
            const updateData = migrateItemData(i.data);
            if (!isObjectEmpty(updateData)) {
                console.log(`Migrating Item entity ${i.name}`);
                await i.update(updateData, { enforceTypes: false });
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Migrate World Compendium Packs
    const packs = game.packs.filter((p) => {
        return p.metadata.package === "world" && ["Actor", "Item", "Scene"].includes(p.metadata.entity);
    });
    for (let p of packs) {
        console.log(`Migrating Compendium ${p.name}`);
        await migrateCompendium(p);
    }

    // Set the migration as complete
    game.settings.set("metro-2033", "systemMigrationVersion", game.system.data.version);
    ui.notifications.info(`MYZ System Migration to version ${game.system.data.version} completed!`, { permanent: true });
    */
};

/* -------------------------------------------- */
/*  Entity Type Migration Helpers               */
/* -------------------------------------------- */

/**
 * Apply migration rules to all Entities within a single Compendium pack
 * @param pack
 * @return {Promise}
 */
export const migrateCompendium = async function (pack) {
    const entity = pack.metadata.entity;
    if (!["Actor", "Item", "Scene"].includes(entity)) return;

    // Begin by requesting server-side data model migration and get the migrated content
    await pack.migrate();
    const content = await pack.getContent();

    // Iterate over compendium entries - applying fine-tuned migration functions
    for (let ent of content) {
        try {
            let updateData = null;
            if (entity === "Item") updateData = migrateItemData(ent.data);
            else if (entity === "Actor") updateData = migrateActorData(ent.data);
            else if (entity === "Scene") updateData = migrateSceneData(ent.data);
            if (!isObjectEmpty(updateData)) {
                expandObject(updateData);
                updateData["_id"] = ent._id;
                await pack.updateEntity(updateData);
                console.log(`Migrated ${entity} entity ${ent.name} in Compendium ${pack.collection}`);
            }
        } catch (err) {
            console.error(err);
        }
    }
    console.log(`Migrated all ${entity} entities from Compendium ${pack.collection}`);
};
/* -------------------------------------------- */

/**
 * Migrate a single Actor entity to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {Actor} actor   The actor to Update
 * @return {Object}       The updateData to apply
 */
export const migrateActorData = function (actor) {
    const updateData = {};
    //_migrateActorResources(actor, updateData);
    _migrateActorRelationships(actor, updateData);
    _addKnowNatureToNPC(actor, updateData);

    if (!actor.items) return updateData;
    let hasItemUpdates = false;
    const items = actor.items.map((i) => {
        // Migrate the Owned Item
        let itemUpdate = migrateItemData(i);
        // Update the Owned Item
        if (!isObjectEmpty(itemUpdate)) {
            hasItemUpdates = true;
            return foundry.utils.mergeObject(i, itemUpdate, { enforceTypes: false, inplace: false });
        } else return i;
    });
    if (hasItemUpdates) updateData.items = items;

    return updateData;
};
/* -------------------------------------------- */

/**
 * Migrate a single Item entity to incorporate latest data model changes
 * @param item
 */
export const migrateItemData = function (item) {
    const updateData = {};
    _migrateItemToArtifact(item, updateData);
    _migrateSkillKey(item, updateData);
    // Remove deprecated fields
    //_migrateRemoveDeprecated(item, updateData);
    // Return the migrated update data
    return updateData;
};

/* -------------------------------------------- */

/**
 * Migrate a single Scene entity to incorporate changes to the data model of it's actor data overrides
 * Return an Object of updateData to be applied
 * @param {Object} scene  The Scene data to Update
 * @return {Object}       The updateData to apply
 */
export const migrateSceneData = function (scene) {
    const tokens = duplicate(scene.tokens);
    return {
        tokens: tokens.map((t) => {
            if (!t.actorId || t.actorLink || !t.actorData.data) {
                t.actorData = {};
                return t;
            }
            const token = new Token(t);
            if (!token.actor) {
                t.actorId = null;
                t.actorData = {};
            } else if (!t.actorLink) {
                const updateData = migrateActorData(token.data.actorData);
                t.actorData = foundry.utils.mergeObject(token.data.actorData, updateData);
            }
            return t;
        }),
    };
};

/* -------------------------------------------- */
/*  Low level migration utilities
/* -------------------------------------------- */

function _migrateActorResources(actor, updateData) {
    const r = game.system.model.Actor.mutant.resources;
    //populate NPCs that have resources{}
    for (let k of Object.keys(r)) {
        if (!actor.data.resources.hasOwnProperty(k)) {
            updateData[`data.resources.${k}`] = { value: "0" };
        }
    }
    // remove resources.resources and update respources.key=value
    for (let k of Object.keys(actor.data.resources || {})) {
        //console.warn(k);
        if (k in r) {
            console.warn(`Actor already has this resource type`, actor.data.resources[k]);
            updateData[`data.resources.${k}`] = actor.data.resources[k];
        } else {
            updateData[`data.resources.-=${k}`] = null;
        }
    }
}
function _migrateActorRelationships(actor, updateData) {
    const r = game.system.model.Actor.mutant.relationships;
    if (!actor.data.hasOwnProperty("relationships")) {
        updateData[`data.relationships`] = r;
    }
}

function _migrateItemToArtifact(item, updateData) {
    if (item.type == "armor" || item.type == "weapon") {
        //console.log(item.type);
        if (!item.data.hasOwnProperty("dev_requirement")) {
            updateData[`data.dev_requirement`] = "";
            updateData[`data.dev_bonus`] = 0;
        }
    }
}

// ! ADDING SKILL KEY TO A SKILL
function _migrateSkillKey(item, updateData) {
    if (item.type == "skill") {
        //console.log(`${item.name} TO KEY>> ${mapSkillKey(item.name)}`);
        if (item.data.hasOwnProperty("skillKey")) {
            if (item.data.skillKey != mapSkillKey(item.name)) {
                updateData[`data.skillKey`] = mapSkillKey(item.name);
            }
        }
        if (!item.data.hasOwnProperty("skillKey")) {
            console.log(`${item.name} adding skillKey ${mapSkillKey(item.name)}`);
            updateData[`data.skillKey`] = mapSkillKey(item.name);
        }
    }
}

// ! ADDING KNOW NATURE
function _addKnowNatureToNPC(actor, updateData) {
    if (actor.type == "pnj") {
        if (!actor.data.hasOwnProperty('knowNature')) {
            updateData['data.knowNature'] = 0;
        }
    }
}

/* -------------------------------------------- */
/**
 * Map Skill Key To Skill Name
 * @param {Object} skillName    The data object for an Actor
 */
function mapSkillKey(skillName) {
    let skillKey = "";
    switch (skillName) {
        case "Endure":
            skillKey = "ENDURE";
            break;
        case "Force":
            skillKey = "FORCE";
            break;
        case "Fight":
            skillKey = "FIGHT";
            break;
        case "Sneak":
            skillKey = "SNEAK";
            break;
        case "Move":
            skillKey = "MOVE";
            break;
        case "Shoot":
            skillKey = "SHOOT";
            break;
        case "Scout":
            skillKey = "SCOUT";
            break;
        case "Comprehend":
            skillKey = "COMPREHEND";
            break;
        case "Know the Zone":
            skillKey = "KNOWTHEZONE";
            break;
        case "Sense Emotion":
            skillKey = "SENSEEMOTION";
            break;
        case "Manipulate":
            skillKey = "MANIPULATE";
            break;
        case "Heal":
            skillKey = "HEAL";
            break;
        case "Dominate":
            skillKey = "DOMINATE";
            break;
        case "Overload":
            skillKey = "OVERLOAD";
            break;
        case "Assault":
            skillKey = "ASSAULT";
            break;
        case "Infiltrate":
            skillKey = "INFILTRATE";
            break;
        case "Scan":
            skillKey = "SCAN";
            break;
        case "Datamine":
            skillKey = "DATAMINE";
            break;
        case "Analyze":
            skillKey = "ANALYZE";
            break;
        case "Question":
            skillKey = "QUESTION";
            break;
        case "Interact":
            skillKey = "INTERACT";
            break;
        case "Repair":
            skillKey = "REPAIR";
            break;
        default:
            skillKey = "";

    }
    return skillKey;
}

/* -------------------------------------------- */

/**
 * Scrub an Actor's system data, removing all keys which are not explicitly defined in the system template
 * @param {Object} actorData    The data object for an Actor
 * @return {Object}             The scrubbed Actor data
 */
function cleanActorData(actorData) {
    // Scrub system data
    const model = game.system.model.Actor[actorData.type];
    actorData.data = filterObject(actorData.data, model);

    // Return the scrubbed data
    return actorData;
}

/* -------------------------------------------- */

/**
 * A general migration to remove all fields from the data model which are flagged with a _deprecated tag
 * @private
 */
const _migrateRemoveDeprecated = function (ent, updateData) {
    const flat = flattenObject(ent.data);

    // Identify objects to deprecate
    const toDeprecate = Object.entries(flat)
        .filter((e) => e[0].endsWith("_deprecated") && e[1] === true)
        .map((e) => {
            let parent = e[0].split(".");
            parent.pop();
            return parent.join(".");
        });

    // Remove them
    for (let k of toDeprecate) {
        let parts = k.split(".");
        parts[parts.length - 1] = "-=" + parts[parts.length - 1];
        updateData[`data.${parts.join(".")}`] = null;
    }
};
