export class MYZ {
    static STUNTS = {}

    static SKILLKEYS = [
        "bricolage",
        "endurance",
        "corps à corps",
        "réaction",
        "furtivité",
        "tir",
        "observation",
        "compréhension",
        "survie",
        "manipulation",
        "soins",
        "analyse"
  ]

    static CREATURE_TYPES = {
        "pj":"MYZ.PJ",
        "mutant":"MYZ.MUTANT"
    }

    static ATTRIBUTES = {
        "strength":"MYZ.ATTRIBUTE_STRENGTH",
        "agility":"MYZ.ATTRIBUTE_AGILITY",
        "wits":"MYZ.ATTRIBUTE_WITS",
        "empathy":"MYZ.ATTRIBUTE_EMPATHY"
    }

    static ROBOT_LOCATIONS = {
        "head":"MYZ.HEAD",
        "torso":"MYZ.TORSO",
        "undercarriage":"MYZ.UNDERCARRIAGE",
    }

    static RANGES = {
        "range_arm":"MYZ.RANGE_ARM",
        "range_near":"MYZ.RANGE_NEAR",
        "range_short":"MYZ.RANGE_SHORT",
        "range_long":"MYZ.RANGE_LONG",
        "range_distant":"MYZ.RANGE_DISTANT"
    }

    static ITEM_SIZES = {
        "0.00": "MYZ.WEIGHT_TINY",
        "0.25": "MYZ.WEIGHT_QUARTER",
        "0.50": "MYZ.WEIGHT_LIGHT",
        "1.00": "MYZ.WEIGHT_REGULAR",
        "2.00": "MYZ.WEIGHT_HEAVY"
    }

    static WEAPON_CATEGORIES = {
        "melee":"MYZ.WEAPON_MELEE",
        "ranged":"MYZ.WEAPON_RANGED"
    }

    static ARMOR_TYPES = {
        "armor": "MYZ.ARMOR_BODY",
        "shield": "MYZ.ARMOR_SHIELD",
    }

    static TALENT_CREATURE_TYPES = {
        "mutant":"MYZ.TALENT_MUTANT",
        "animal":"MYZ.TALENT_ANIMAL",
        "pnj":"MYZ.TALENT_PNJ"
    }

    static TALENT_ROLE_TYPES = {
        "general":"MYZ.GENERAL",
        "role":"MYZ.ROLE"
    }
}