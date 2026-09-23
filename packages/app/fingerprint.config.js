/** @type {import('@expo/fingerprint').Config} */
const config = {
    // The correctness boundary of every repack: each entry is a promise that
    // the path cannot change the native binary in a way that matters. It lives
    // here rather than in a sibling `.fingerprintignore` because mobile-ci's
    // native key hashes this file - so relaxing a rule invalidates every base
    // binary published while the old rule was in force - and never sees the
    // ignore file. Keep it small enough that every entry can be defended.
    ignorePaths: [
        // HINT: We bump version on each master commit.
        'package.json',
        // Ignore the entire android directory
        '**/android/**/*',
        // Ignore the entire ios directory but still keep ios/Podfile and ios/Podfile.lock
        '**/ios/**/*',
        '!**/ios/Podfile',
        '!**/ios/Podfile.lock',
        // HINT: We have build errors with react-native-audio-api
        '**/node_modules/react-native-audio-api/**/*'
    ],
    // Values that differ per build and are rewritten into the repacked binary
    // rather than compiled into it. `ExpoConfigExtraSection` is deliberately NOT
    // skipped: `extra.appVariant` and `extra.aiEnabled` decide which config
    // plugins app.config.js installs, so they are native surface, and they are
    // asserted by every caller's `expect-config`.
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
