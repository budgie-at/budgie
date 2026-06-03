/** @type {import('@expo/fingerprint').Config} */
const config = {
    sourceSkips: [
        'ExpoConfigRuntimeVersionIfString',
        'ExpoConfigVersions',
        'PackageJsonScriptsAll',
        'ExpoConfigIosBundleIdentifier',
        'ExpoConfigAndroidPackage',
        'ExpoConfigNames'
    ]
};

module.exports = config;
