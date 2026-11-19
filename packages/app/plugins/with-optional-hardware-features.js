const { withAndroidManifest } = require('expo/config-plugins');

const OPTIONAL_FEATURES = ['android.hardware.screen.portrait', 'android.hardware.wifi'];

module.exports = config =>
    withAndroidManifest(config, mod => {
        const manifest = mod.modResults.manifest;
        const features = (manifest['uses-feature'] ?? []).filter(feature => !OPTIONAL_FEATURES.includes(feature.$?.['android:name']));

        manifest['uses-feature'] = [
            ...features,
            ...OPTIONAL_FEATURES.map(name => ({ $: { 'android:name': name, 'android:required': 'false' } }))
        ];

        return mod;
    });
