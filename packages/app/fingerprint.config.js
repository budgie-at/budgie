const { execFileSync } = require('node:child_process');
const { realpathSync } = require('node:fs');
const path = require('node:path');

const autolinkingCli = require.resolve('expo-modules-autolinking/bin/expo-modules-autolinking', {
    paths: [require.resolve('expo/package.json')]
});

// HINT: @expo/fingerprint 0.21.x throws on gradle plugins without a sourceDir and silently drops every expo android autolinking source.
const androidModuleSources = JSON.parse(
    execFileSync('node', [autolinkingCli, 'resolve', '-p', 'android', '--json'], { cwd: __dirname, encoding: 'utf8' })
).modules.flatMap(autolinkedModule =>
    autolinkedModule.projects.map(project => ({
        type: 'dir',
        filePath: path.relative(__dirname, realpathSync(project.sourceDir)),
        reasons: ['expoAutolinkingAndroidNativeSource']
    }))
);

/** @type {import('@expo/fingerprint').Config} */
const config = {
    nativeModuleSourceType: 'files',
    // The correctness boundary of every repack: each entry is a promise that
    // the path cannot change the native binary in a way that matters. It lives
    // here rather than in a sibling `.fingerprintignore` because mobile-ci's
    // native key hashes this file - so relaxing a rule invalidates every base
    // binary published while the old rule was in force - and never sees the
    // ignore file. Keep it small enough that every entry can be defended.
    ignorePaths: [
        // HINT: We bump version on each master commit.
        'package.json',
        // Ignore the app's own generated android directory only (not dependency native sources)
        'android/**/*',
        // Ignore the app's own generated ios directory but still keep ios/Podfile and ios/Podfile.lock
        'ios/**/*',
        '!ios/Podfile',
        '!ios/Podfile.lock',
        // HINT: We have build errors with react-native-audio-api
        '**/node_modules/react-native-audio-api/**/*'
    ],
    extraSources: [
        ...androidModuleSources,
        {
            type: 'contents',
            id: 'op-sqlite-config',
            contents: JSON.stringify(require('../../package.json')['op-sqlite']),
            reasons: ['op-sqlite']
        }
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
