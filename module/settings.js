const debounceReload = foundry.utils.debounce(() => window.location.reload(), 100)
export const registerSystemSettings = function () {
    /**
     * Track the system version upon which point a migration was last applied
     */
    game.settings.register("metro-2033", "systemMigrationVersion", {
        name: "System Migration Version",
        scope: "world",
        config: false,
        type: Number,
        default: 0,
    });

    game.settings.register("metro-2033", "applyPushTrauma", {
        name: "SETTINGS.ApplyPushTraumaN",
        hint: "SETTINGS.ApplyPushTraumaH",
        config: true,
        scope: "world",
        type: Boolean,
        default: true,
    });

    game.settings.register("metro-2033", "applyPushGearDamage", {
        name: "SETTINGS.ApplyPushGearDamageN",
        hint: "SETTINGS.ApplyPushGearDamageH",
        config: true,
        scope: "world",
        type: Boolean,
        default: true,
    });

    game.settings.register("metro-2033", "stuntsJSON", {
        name: "Stunts JSON File",
        hint: "Location for the Stunts File. Use the 'systems/metro-2033/assets/stunts.json' as a template to create translation for stunts.",
        scope: "world",
        config: true,
        type: String,
        default: "systems/metro-2033/assets/stunts.json",
        filePicker: true,
        restricted: true,
        onChange: debounceReload
    });
};
