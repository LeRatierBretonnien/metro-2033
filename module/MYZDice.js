export class MYZDieBase extends foundry.dice.terms.Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "b";

    /* -------------------------------------------- */

    /** @override */
    getResultLabel(result) {
        return {
            1: '<img src="systems/metro-2033/ui/dice/b1.png" />',
            2: '<img src="systems/metro-2033/ui/dice/b2.png" />',
            3: '<img src="systems/metro-2033/ui/dice/b3.png" />',
            4: '<img src="systems/metro-2033/ui/dice/b4.png" />',
            5: '<img src="systems/metro-2033/ui/dice/b5.png" />',
            6: '<img src="systems/metro-2033/ui/dice/b6.png" />',
        }[result.result];
    }
}

export class MYZDieSkill extends foundry.dice.terms.Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }
    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "s";

    /* -------------------------------------------- */

    /** @override */
    getResultLabel(result) {
        return {
            1: '<img src="systems/metro-2033/ui/dice/s1.png" />',
            2: '<img src="systems/metro-2033/ui/dice/s2.png" />',
            3: '<img src="systems/metro-2033/ui/dice/s3.png" />',
            4: '<img src="systems/metro-2033/ui/dice/s4.png" />',
            5: '<img src="systems/metro-2033/ui/dice/s5.png" />',
            6: '<img src="systems/metro-2033/ui/dice/s6.png" />',
        }[result.result];
    }
}

export class MYZDieGear extends foundry.dice.terms.Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }
    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "g";

    /* -------------------------------------------- */

    /** @override */
    getResultLabel(result) {
        return {
            1: '<img src="systems/metro-2033/ui/dice/g1.png" />',
            2: '<img src="systems/metro-2033/ui/dice/g2.png" />',
            3: '<img src="systems/metro-2033/ui/dice/g3.png" />',
            4: '<img src="systems/metro-2033/ui/dice/g4.png" />',
            5: '<img src="systems/metro-2033/ui/dice/g5.png" />',
            6: '<img src="systems/metro-2033/ui/dice/g6.png" />',
        }[result.result];
    }
}
