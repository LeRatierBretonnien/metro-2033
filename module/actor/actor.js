/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MYZActor extends Actor {
  /**
   * Augment the basic actor values with additional dynamic values.
   */
  prepareData() {
    super.prepareData();

  }

  // @override
  //prepareDerivedData() {
  prepareBaseData() {
    const characterTypes = ["mutant", "pj", "pnj"]
    if (characterTypes.includes(this.type)) {
      this._prepareMutantData();
    }
    if (this.type == "vehicle") {
      this._prepareVehicleData();
    }

    if (this.type == "station") {
      this._prepareStationData();
    }
  }
  /**
   * Prepare Character type specific data
   */
  _prepareMutantData() {
    if (this.type == "pj") {
      this.system.creatureType = "pj";
    } else {
      this.system.creatureType = "pnj";
    }
    
    let equippedArmor = this.items.filter(i => i.type == "armor" && !i.system.stashed && i.system.equipped && i.system.armorType == "armor");
    if (equippedArmor.length) {
      let equippedArmorTotal = equippedArmor.reduce(function (acc, obj) { return parseInt(acc) + parseInt(obj.system.rating.value); }, 0);
      this.system.armorrating.value = parseInt(equippedArmorTotal);
    } else {
      this.system.armorrating.value = 0;
    }

    // Update encumbrance
    this.system.isEncumbered = "";
    this.system.encumbranceMax = parseInt(this.system.attributes.strength.max) * 2;

    // Check for SCROUNGER Animal Talent and replace Str with Wits
    const findScroungerTalent = this.items.filter(item => (item.type === 'talent' && item.name === 'Scrounger'))
    if (findScroungerTalent.length === 1)
      this.system.encumbranceMax = parseInt(this.system.attributes.wits.max) * 2;

    // Pack Mule talent
    if ('items' in this) {
      const items = Array.from(this.items.values())
      const findPackMuleTalent = items.filter(item => (item.type === 'talent' && item.name === 'Pack Mule'))
      if (findPackMuleTalent.length === 1) {
        this.system.encumbranceMax *= 2;
      }
    }
    let encumbranceBonus = (this.system.encumbranceBonus) ? this.system.encumbranceBonus : 0;
    this.system.encumbranceMax += encumbranceBonus;
    let _totalWeight = 0;
    // add items
    let physicalItems = this.items.filter(i => i.system.weight != undefined);
    let weightedItems = physicalItems.filter(_itm => _itm.system.weight > 0 && !_itm.system.stashed);
    let itemsWeight = weightedItems.reduce(function (accumulator, i) {
      return accumulator + (parseInt(i.system.quantity) * Number(i.system.weight));
    }, 0);
    _totalWeight += Number(itemsWeight);
    //add grub, water, booze and bullets
    try {
      _totalWeight += parseInt(this.system.resources.grub.value) / 4;
      _totalWeight += parseInt(this.system.resources.grubRot.value) / 4;
      _totalWeight += parseInt(this.system.resources.water.value) / 4;
      _totalWeight += parseInt(this.system.resources.waterRot.value) / 4;
      _totalWeight += parseFloat(this.system.resources.booze.value);
      _totalWeight += parseInt(this.system.resources.bullets.value) / 20;
    } catch (error) {
      console.error(error);
    }
    _totalWeight = Math.round((_totalWeight + Number.EPSILON) * 100) / 100
    this.system.itemsWeight = _totalWeight;
    if (_totalWeight > this.system.encumbranceMax) {
      this.system.isEncumbered = "encumbered";
    } else {
      this.system.isEncumbered = "";
    }
  }


  // ! ARK METHODS
  /**
   * Prepare Ark type specific data
   */
  _prepareStationData() {
    const devItems = this.items.filter(i => i.system.food != undefined || i.system.culture != undefined || i.system.technology != undefined || i.system.warfare != undefined);
    let food = devItems.reduce((total, item) => total + item.system.food, 0);
    let culture = devItems.reduce((total, item) => total + item.system.culture, 0);
    let technology = devItems.reduce((total, item) => total + item.system.technology, 0);
    let warfare = devItems.reduce((total, item) => total + item.system.warfare, 0);
    this.system.dev_levels.food.value = parseFloat(food);
    this.system.dev_levels.culture.value = parseFloat(culture);
    this.system.dev_levels.technology.value = parseFloat(technology);
    this.system.dev_levels.warfare.value = parseFloat(warfare);
  }

  // ! VEHICLE METHODS
  /**
   * Prepare Vehicle type specific data
   */
  _prepareVehicleData() {
    //console.warn('ITS VEHICLE')
  }

}
