export default class MYZHooks {

  static async onCreateActor(actor, options, userId) {
    // Set creatureType and use it for building NPCS and PCs
    // NPCs should have type=npc and ceratureType = mutant/animal/robot/human
    // PCs should have type=mutant/animal/robot/human and ceratureType = mutant/animal/robot/human
    if (game.user.id !== userId)
      return;
    let updateData = {};
    updateData["token.disposition"] = CONST.TOKEN_DISPOSITIONS.NEUTRAL;
    updateData["token.vision"] = true;
    if (actor.type != "pnj") {
      updateData["system.creatureType"] = actor.type;
      updateData["token.actorLink"] = true;
      updateData["img"] = `systems/metro-2033/assets/ico/img-${actor.type}.svg`
    }
    if (actor.type == "pnj") {
      if (actor.system.creatureType == "")
        updateData["system.creatureType"] = actor.type;
    }
    await actor.update(updateData, { renderSheet: true });

    //IF ACTOR IS ARK DON'T DO ANYTHING ELSE
    if (actor.type == "station" || actor.type == "vehicle") return;

    if (actor.type != "pnj") {
      // Check if skill allready exists by some chance
      let skillIndex = await game.packs.get("metro-2033.core-data").getDocuments();
    // Filter skillIndex array to include only skills for Actor Type.
      let _skillsList = skillIndex.filter((i) => i.type == "skill");
      // Add ACTOR TYPE and CORE to each skill in _skillsList before you assign it to the actor;
      let _sl = [];
      _skillsList.forEach((s) => {
        s.system["creatureType"] = actor.type;
        s.system["coreSkill"] = true;
        _sl.push(s);
      });
      await actor.createEmbeddedDocuments("Item", _sl);
      }
    }

    static onUpdateOwnedItem(item, updateData, option, _id) {
    // UPDATING OWNED ITEM
    if (!item.parent) return;

    // ! MAKE SURE OWNED SKILLS/ABILITIES/TALENTS ARE OF THE SAME TYPE AS THE ACTOR
    if (item.type == "skill" || item.type == "ability" || item.type == "talent") {
      updateData.system.creatureType = item.actor.system.creatureType;
    }
  }

  static onPreCreateItem(item, updateData, options) {
    // CREATING OWNED ITEM
    if (!item.parent) return;

    if (item.type == "project" && item.actor.type != "ark") {
      ui.notifications.warn(`You can add Project only to Ark`);
      return false;
    }
    if (item.type == "chassis" && item.actor.system.creatureType != "robot") {
      ui.notifications.warn(`You can't add Chassis to a non-robot character`);
      return false;
    }
    if (item.type == "armor" && item.actor.system.creatureType == "robot") {
      ui.notifications.warn(`You can't add Armor to a robot character`);
      return false;
    }
    if (item.type == "critical" && item.actor.system.creatureType == "robot") {
      ui.notifications.warn(`You can't assign Criticals to a robot character`);
      return false;
    }
    if (item.type == "skill" || item.type == "ability" || item.type == "talent") {
      item.updateSource({ "system.creatureType": item.actor.system.creatureType })
    }
  }
}
