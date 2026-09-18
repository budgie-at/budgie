// Adds the iOS WidgetKit extension, copying its sources into the generated ios/ project.

const fs = require('node:fs');
const path = require('node:path');

const { withDangerousMod, withXcodeProject } = require('expo/config-plugins');

const { addAppExtensionTarget } = require('./app-extension-target');

const TARGET = 'BudgieWidgets';
const SOURCE_DIR = path.join(__dirname, 'widgets');

const SWIFT_FILES = [
    'BudgieWidgets.swift',
    'WidgetSnapshot.swift',
    'WidgetPalette.swift',
    'WidgetLinks.swift',
    'WidgetBackground.swift',
    'WidgetEmptyState.swift',
    'NetWorthWidget.swift'
];

const ENTITLEMENTS_FILE = `${TARGET}.entitlements`;
const PLIST_FILE = 'Info.plist';

const APP_GROUP_TOKEN = '__BUDGIE_APP_GROUP__';
const SCHEME_TOKEN = '__BUDGIE_SCHEME__';

const appGroupFor = config => {
    const group = config.ios?.infoPlist?.BudgieAppGroup;

    if (typeof group !== 'string' || group.length === 0) {
        throw new Error('with-widget-extension: ios.infoPlist.BudgieAppGroup must be set — it is the App Group the widgets read from.');
    }

    return group;
};

const schemeFor = config => {
    const scheme = Array.isArray(config.scheme) ? config.scheme[0] : config.scheme;

    if (typeof scheme !== 'string' || scheme.length === 0) {
        throw new Error('with-widget-extension: a URL scheme must be set — a widget tap has nothing to open without one.');
    }

    return scheme;
};

const withSources = config =>
    withDangerousMod(config, [
        'ios',
        dangerousConfig => {
            const targetDir = path.join(dangerousConfig.modRequest.platformProjectRoot, TARGET);

            fs.mkdirSync(targetDir, { recursive: true });

            for (const file of SWIFT_FILES) {
                fs.copyFileSync(path.join(SOURCE_DIR, file), path.join(targetDir, file));
            }

            const substitutions = [
                [APP_GROUP_TOKEN, appGroupFor(dangerousConfig)],
                [SCHEME_TOKEN, schemeFor(dangerousConfig)]
            ];

            for (const file of [PLIST_FILE, ENTITLEMENTS_FILE]) {
                let contents = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8');

                for (const [token, value] of substitutions) {
                    contents = contents.split(token).join(value);
                }

                fs.writeFileSync(path.join(targetDir, file), contents);
            }

            return dangerousConfig;
        }
    ]);

const withTarget = config =>
    withXcodeProject(config, xcodeConfig => {
        const project = xcodeConfig.modResults;

        if (project.pbxTargetByName(TARGET)) {
            return xcodeConfig;
        }

        const appBundleId = xcodeConfig.ios?.bundleIdentifier;

        if (appBundleId === undefined) {
            throw new Error('with-widget-extension: ios.bundleIdentifier must be set before the extension can be given one.');
        }

        addAppExtensionTarget(project, xcodeConfig, {
            targetName: TARGET,
            bundleId: `${appBundleId}.${TARGET}`,
            sourceFiles: SWIFT_FILES,
            entitlementsFile: ENTITLEMENTS_FILE
        });

        return xcodeConfig;
    });

module.exports = config => withTarget(withSources(config));
