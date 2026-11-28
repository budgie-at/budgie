const { withInfoPlist } = require('expo/config-plugins');

module.exports = (config, { keepDevLauncherNetworkAccess }) =>
    withInfoPlist(config, mod => {
        mod.modResults.UIBackgroundModes = (mod.modResults.UIBackgroundModes ?? []).filter(mode => mode !== 'fetch');

        if (!keepDevLauncherNetworkAccess) {
            delete mod.modResults.NSLocalNetworkUsageDescription;
        }

        return mod;
    });
