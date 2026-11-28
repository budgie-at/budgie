const { withInfoPlist } = require('expo/config-plugins');

module.exports = config =>
    withInfoPlist(config, mod => {
        mod.modResults.UIBackgroundModes = (mod.modResults.UIBackgroundModes ?? []).filter(mode => mode !== 'fetch');

        return mod;
    });
