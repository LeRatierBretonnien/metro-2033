/** This class is responsible for rolling dice */

export class DiceRoller {

  static async Roll({ rollName = "Roll Name", base = 0, skill = 0, gear = 0, damage = null, actor = null, actorUuid = "", skillUuid = "", attributeName = null, itemId = null, modifiers = null } = {}) {
    console.warn("DiceRoller.Roll is hot.");
    let rollFormula = `${base}db + ${skill}ds + ${gear}dg`;

    let roll = new Roll(rollFormula);
    await roll.evaluate();

    const dicePool = await DiceRoller.ParseResults(roll, skill);
    dicePool.sort(DiceRoller.SortPool);
    // What was this part ? It m to chat as Damage.
    let computedDamage = damage;
    if (damage) {
      this.baseDamage = damage;
      if (damage > 0) {
        computedDamage = computedDamage - 1;
      }
      this.lastDamage = computedDamage;
    } else {
      this.baseDamage = 0;
    }

    await DiceRoller.SendToChat({
      _roll: roll,
      rollName: rollName,
      isPushed: false,
      dicePool: dicePool,
      rollName: rollName,
      base: base,
      skill: skill,
      gear: gear,
      damage: damage,
      actor: actor,
      actorUuid: actorUuid,
      skillUuid: skillUuid,
      attributeName: attributeName,
      itemId: itemId,
      modifiers: modifiers,
    });

  }

  static async processAffliction(message, html, data, ev) {
    const actorId = message.getFlag("metro-2033", "actor");
    const actor = game.actors.get(actorId);
    if (!actor || !actor.isOwner) {
      ui.notifications.warn("You are not the owner of this actor.");
      return;
    }
    const attrName = message.getFlag("metro-2033", "attributeName");
    if (!attrName) {
      ui.notifications.warn("No attribute name found.");
      return;
    }
    let baneCount = message.getFlag("metro-2033", "baneCount") || 0;
    if (baneCount <= 0) {
      ui.notifications.warn("No bane count found.");
      return;
    }
    const baneCountId = message.getFlag("metro-2033", "baneCountId") || 0;
    // Check which button was clicked
    const button = $(ev.currentTarget);
    const buttonText = button.text();
    if (buttonText.includes("équipement")) {
      ui.notifications.info("Please manually attribute the affliction to a piece of gear.");
    } else if (buttonText.includes("Sang-Froid")) {
      // Increase Sang-Froid
      const sangfroid = actor.system.counters.sangfroid.value
      const newVal = sangfroid + 1;
      const updateData = {};
      updateData[`system.counters.sangfroid.value`] = newVal;
      await actor.update(updateData);
      ui.notifications.info(`Sang-Froid augmenté de 1`);
    } else if (buttonText.includes("Stress")) {
      // Increase Stress
      const stress = actor.system.counters.stress.value
      const newVal = stress + 1;
      const updateData = {};
      updateData[`system.counters.stress.value`] = newVal;
      await actor.update(updateData);
      ui.notifications.info(`Stress augmenté de 1`);
    } else {
      // Decrease the attribute
      const attributes = actor.system.attributes || {};
      const attribute = attributes[attrName];
      if (attribute?.value > 0) {
        const { value, min } = attribute;
        const newVal = Math.max(min, value - 1);
        if (newVal !== value) {
          const updateData = {};
          updateData[`system.attributes.${attrName}.value`] = newVal;
          await actor.update(updateData);
          ui.notifications.info(`${attrName} diminué de 1`);
        } else {
          ui.notifications.info(`${attrName} déja au minimum`);
        }
      } else {
        ui.notifications.info(`${attrName} déja au minimum`);
      }
    }
    // Update the baneCount value
    baneCount = baneCount - 1;
    $(`#${baneCountId}`).html(baneCount);
    // Store the new baneCount value in the message flags
    await message.setFlag("metro-2033", "baneCount", baneCount);
    if (baneCount <= 0) {
      // Remove the message after processings
      await message.delete();
    }
  }

  static async showAfflictionMessage(actor, baneCount, message) {
    let attrName = message.getFlag("metro-2033", "attributeName")
    let baneCountId = `bane-count-${new Date().getTime()}`;
    let htmlData = {
      name: actor.name,
      baneCount,
      baneCountId,
      attributeName: attrName,
      attributNameKey: `MYZ.${attrName.toUpperCase()}`
    };
    const html = await renderTemplate("systems/metro-2033/templates/chat/ask-affliction.html", htmlData);
    let chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: actor, token: actor?.token, alias: actor?.name || "" }),
      alias: ChatMessage.alias,
      rollMode: game.settings.get("core", "rollMode"),
      content: html,
    };
    if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients("GM");
    } else if (chatData.rollMode === "selfroll") {
      chatData.whisper = [game.user];
    }
    const msg = await ChatMessage.create(chatData);
    await msg.setFlag("metro-2033", "actor", actor.id);
    await msg.setFlag("metro-2033", "attributeName", attrName);
    await msg.setFlag("metro-2033", "baneCount", baneCount);
    await msg.setFlag("metro-2033", "baneCountId", baneCountId);
  }

  static async Push(message, html, data) {
    console.log(message)
    console.log(data)
    // create formula from message.flags.dicePool
    if (!message.getFlag("metro-2033", "dicePool"))
      throw new Error("No dice pool found in message flags");

    // Get dice with results
    // base dice with 6, gear dice with 6, skill dice with 6
    let diceWithResults
    if (game.settings.get("metro-2033", "rerollOne")) {
      diceWithResults = message.getFlag("metro-2033", "dicePool").filter(d => (d.diceType === "base" && (d.value === 6)) || (d.diceType === "gear" && (d.value === 6)) || (d.diceType === "skill" && d.value === 6));
    } else {
      diceWithResults = message.getFlag("metro-2033", "dicePool").filter(d => (d.diceType === "base" && (d.value === 1 || d.value === 6)) || (d.diceType === "gear" && (d.value === 1 || d.value === 6)) || (d.diceType === "skill" && (d.value === 6)));
    }
    // add property oldRoll to each dice
    diceWithResults.forEach(d => {
      d.hasResult = true;
    });

    // Get the dice count for the dice without results and create a new roll formula
    const baseCount = message.getFlag("metro-2033", "dicePool").filter(d => (d.diceType === "base" && (d.value != 1 && d.value != 6))).length;
    const skillCount = message.getFlag("metro-2033", "dicePool").filter(d => d.diceType === "skill" && d.value != 6).length;
    const gearCount = message.getFlag("metro-2033", "dicePool").filter(d => d.diceType === "gear" && (d.value != 1 && d.value != 6)).length;
    const rollFormula = `${baseCount}db + ${skillCount}ds + ${gearCount}dg`;
    const roll = new Roll(rollFormula);
    await roll.evaluate();

    // Parse roll
    const dicePool = await DiceRoller.ParseResults(roll, message.getFlag("metro-2033", "skill") || 0);

    const finalPool = diceWithResults.concat(dicePool);
    finalPool.sort(DiceRoller.SortPool);

    // update the message with the new dice pool
    await message.update({
      content: await renderTemplate("systems/metro-2033/templates/chat/roll.html", {
        name: message.getFlag("metro-2033", "rollName") || "Roll Name",
        isPushed: true,
        dicePool: finalPool,
        successes: DiceRoller.CountSuccesses(finalPool),
        failures: DiceRoller.CountFailures(finalPool),
        gearfailures: DiceRoller.CountGearFailures(finalPool),
        damage: message.getFlag("metro-2033", "damage") || 0,
        stuntText: message.getFlag("metro-2033", "stuntText") || "",
        modifiers: message.getFlag("metro-2033", "modifiers") || null,
      }),
    });
    await message.setFlag("metro-2033", "dicePool", finalPool);

    try {
      await game.dice3d.showForRoll(roll);
    } catch (error) {
      //console.warn("DiceRoller.Push error showing 3D dice", error);
    }

    // Check For Trauma to Actor and Gear
    if (message.getFlag("metro-2033", "actorUuid")) {
      const actorUuid = message.getFlag("metro-2033", "actorUuid");
      const actor = await fromUuid(actorUuid);
      const itemId = message.getFlag("metro-2033", "itemId") || null;
      // Deal trauma to characters and npcs
      if (actor && actor.isOwner && ['mutant', 'animal', 'pj', 'pnj', 'station'].includes(actor.type) &&
        game.settings.get("metro-2033", "applyPushTrauma")) {
        const attributeName = message.getFlag("metro-2033", "attributeName");
        const updateData = {};
        let traumaCount = await message.getFlag("metro-2033", "traumaCount") || 0;
        const baneCount = DiceRoller.CountFailures(finalPool) - traumaCount;
        if (baneCount > 0) {
          this.showAfflictionMessage(actor, baneCount, message);
          // Adds Resources Points only to Mutants and Animals
          if (['mutant', 'animal'].includes(actor.type) || ['mutant', 'animal'].includes(actor.system.creatureType)) {
            const resPts = actor.system['resource_points'] ?? { value: 0, max: 10 };
            if (resPts) {
              const { value, max } = resPts;
              const newVal = Math.min(max, value + baneCount);
              if (newVal !== value) {
                updateData[`system.resource_points.value`] = newVal;
              }
            }
          }
          traumaCount += baneCount;
          await message.setFlag("metro-2033", "traumaCount", traumaCount);
        }

        if (!foundry.utils.isEmpty(updateData)) {
          await actor.update(updateData);
        }
      }

      // Applies pushed roll effect to the gear.
      if (actor && itemId && game.settings.get("metro-2033", "applyPushGearDamage")) {
        const item = actor.items.get(message.getFlag("metro-2033", "itemId"));
        let gearDamageCount = await message.getFlag("metro-2033", "gearDamageCount") || 0;
        const baneCount = DiceRoller.CountGearFailures(finalPool) - gearDamageCount;
        const bonus = item.system.bonus;
        if (bonus) {
          const { value } = bonus;
          const newVal = Math.max(0, value - baneCount);
          if (newVal !== value) {
            await item.update({ 'system.bonus.value': newVal });
          }
          gearDamageCount += baneCount;
          await message.setFlag("metro-2033", "gearDamageCount", gearDamageCount);
        }
      }
    }
  }

  /**     * Takes a roll and Creates the result object to be send with messages     */
  static async ParseResults(_roll, _skill) {
    let parsedResult = [];
    _roll.dice.forEach((d) => {
      d.results.forEach((r) => {
        let successAndWeight = DiceRoller.GetSuccessAndWeight(r.result, DiceRoller.MapDiceType(d.constructor.name), _skill);
        parsedResult.push({
          diceType: DiceRoller.MapDiceType(d.constructor.name),
          value: r.result,
          success: successAndWeight.success,
          weight: successAndWeight.weight,
        });
      });
    });
    return parsedResult;
  }

  /**     * Send the roll result to chat     */
  static async SendToChat({ isPushed = false, dicePool = null, _roll = null, rollName = "Roll Name", base = 0, skill = 0, gear = 0, damage = null, actor = null, actorUuid = "", skillUuid = "", attributeName = null, itemId = null, modifiers = null } = {}) {

    let numberOfSuccesses = DiceRoller.CountSuccesses(dicePool);
    let numberOfFailures = DiceRoller.CountFailures(dicePool);
    let numberOfGearFailures = DiceRoller.CountGearFailures(dicePool);

    let stuntText = ""
    try {
      const actor = await fromUuid(actorUuid);
      const _skill = await fromUuid(skillUuid)
      //stuntText = DiceRoller._getStuntText(_skill, actor)
      stuntText = actor ? CONFIG.MYZ.STUNTS[_skill.system.skillKey][actor.system.creatureType] : "";
      // If there is no stunt description for this type of creature return the first description you find
      if (stuntText == "" && CONFIG.MYZ.STUNTS[_skill.system.skillKey]) {
        console.warn('Looking for other stunt description')
        stuntText = DiceRoller._findFirstNonEmpty(CONFIG.MYZ.STUNTS[_skill.system.skillKey])
      }
    } catch (error) {
      // probably no skill included, or some custom skill
      // console.warn(error)
    }

    let htmlData = {
      name: rollName,
      isPushed: isPushed,
      successes: numberOfSuccesses,
      failures: numberOfFailures,
      gearfailures: numberOfGearFailures,
      damage: damage,
      dicePool: dicePool,
      actor: actor,
      actorUuid: actorUuid,
      skillUuid: skillUuid,
      stuntText: stuntText,
      modifiers: modifiers
    };
    const html = await renderTemplate("systems/metro-2033/templates/chat/roll.html", htmlData);
    let chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: actor, token: actor?.token, alias: actor?.name || "" }),
      alias: ChatMessage.alias,
      rollMode: game.settings.get("core", "rollMode"),
      content: html,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      rolls: [_roll],
    };
    if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients("GM");
    } else if (chatData.rollMode === "selfroll") {
      chatData.whisper = [game.user];
    }
    const msg = await ChatMessage.create(chatData);
    msg.setFlag("metro-2033", "itemId", itemId || null);
    msg.setFlag("metro-2033", "dicePool", dicePool || []);
    msg.setFlag("metro-2033", "skill", skill ? skill : 0);
    msg.setFlag("metro-2033", "damage", damage || 0);
    msg.setFlag("metro-2033", "actor", actor ? actor.id : null);
    msg.setFlag("metro-2033", "stuntText", stuntText ? stuntText : null);
    msg.setFlag("metro-2033", "rollName", rollName || "");
    msg.setFlag("metro-2033", "attributeName", attributeName || null);
    msg.setFlag("metro-2033", "itemId", itemId || null);
    msg.setFlag("metro-2033", "actorUuid", actorUuid || null);
    msg.setFlag("metro-2033", "modifiers", modifiers || null)
  }

  /**     * Map the dice type to a string     */
  static MapDiceType(dT) {
    let dType = "";
    switch (dT) {
      case "MYZDieBase":
        dType = "base";
        break;
      case "MYZDieSkill":
        dType = "skill";
        break;
      case "MYZDieGear":
        dType = "gear";
        break;
      default:
        dType = null;
    }
    return dType;
  }

  /**     * Get success and weight based on the dice value and type   */
  static GetSuccessAndWeight(diceValue, diceType, _skill) {
    if (diceValue === 6) {
      if (diceType === "skill" && _skill < 0) {
        return { success: -1, weight: -1 };
      }
      return { success: 1, weight: 1 };
    }
    if (diceValue === 1 && diceType !== "skill") {
      return { success: 0, weight: -2 };
    }
    return { success: 0, weight: 0 };
  }

  /**     * Count total successes     */
  static CountSuccesses(dicePool) {
    let result = 0;
    dicePool.forEach((die) => {
      result = result + die.success;
    });
    return result;
  }

  /**     * Count total failures     */
  static CountFailures(dicePool) {
    let result = 0;
    dicePool.forEach((dice) => {
      if (dice.value === 1) {
        result++;
      }
    });
    return result;
  }

  /**     * Count gear failures     */
  static CountGearFailures(dicePool) {
    let result = 0;
    dicePool.forEach((dice) => {
      if (dice.value === 1 && dice.diceType === "gear") {
        result++;
      }
    });
    return result;
  }

  static SortPool(a, b) {
    const diceTypeOrder = ["base", "skill", "gear"];
    const aTypeIndex = diceTypeOrder.indexOf(a.diceType);
    const bTypeIndex = diceTypeOrder.indexOf(b.diceType);
    if (aTypeIndex !== bTypeIndex) {
      return aTypeIndex - bTypeIndex;
    }
    return b.weight - a.weight;
  }

  static _findFirstNonEmpty(obj) {
    for (let key in obj) {
      if (obj[key] !== null && obj[key] !== "") {
        return obj[key];
      }
    }
    return "";
  }
  // ------------------------------------------------------------------------------------------------------------


}
