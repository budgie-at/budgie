const { IOSConfig, withDangerousMod, withEntitlementsPlist, withInfoPlist, withXcodeProject } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const INFO_PLIST_KEY = 'BudgieWalletCaptureAppGroupIdentifier';
const SWIFT_FILE_NAME = 'BudgieWalletCaptureIntent.swift';

const validateAppGroupIdentifier = appGroupIdentifier => {
    if (typeof appGroupIdentifier !== 'string' || appGroupIdentifier.length === 0) {
        throw new Error('withAppleWalletCapture requires a non-empty appGroupIdentifier option');
    }
};

const ensureApplicationGroup = (groups, appGroupIdentifier) => {
    if (!groups) {
        return [appGroupIdentifier];
    }

    if (!Array.isArray(groups)) {
        throw new Error('com.apple.security.application-groups must be an array when defined');
    }

    return groups.includes(appGroupIdentifier) ? groups : [...groups, appGroupIdentifier];
};

const hasSourceFile = (project, filePath, targetUuid) => {
    const buildFiles = project.pbxBuildFileSection();
    const sourcePhase = project.pbxSourcesBuildPhaseObj(targetUuid);

    if (!sourcePhase?.files) {
        return false;
    }

    return sourcePhase.files.some(file => {
        const buildFile = buildFiles[file.value];

        return buildFile?.fileRef_comment === filePath || buildFile?.fileRef_comment === SWIFT_FILE_NAME;
    });
};

const addSwiftFileToXcodeProject = (projectConfig, swiftFilePath) => {
    const project = projectConfig.modResults;
    const projectName = projectConfig.modRequest.projectName;
    const nativeTarget = IOSConfig.XcodeUtils.getApplicationNativeTarget({ project, projectName });

    if (hasSourceFile(project, swiftFilePath, nativeTarget.uuid)) {
        return projectConfig;
    }

    IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath: swiftFilePath,
        groupName: projectName,
        project,
        targetUuid: nativeTarget.uuid
    });

    return projectConfig;
};

const copySwiftFile = config => {
    const sourcePath = path.join(config.modRequest.projectRoot, 'modules/apple-wallet-capture/plugin', SWIFT_FILE_NAME);
    const targetPath = path.join(config.modRequest.platformProjectRoot, config.modRequest.projectName, SWIFT_FILE_NAME);

    fs.copyFileSync(sourcePath, targetPath);

    return config;
};

module.exports = function withAppleWalletCapture(config, options) {
    const { appGroupIdentifier } = options ?? {};

    validateAppGroupIdentifier(appGroupIdentifier);

    config = withEntitlementsPlist(config, entitlementsConfig => {
        entitlementsConfig.modResults['com.apple.security.application-groups'] = ensureApplicationGroup(
            entitlementsConfig.modResults['com.apple.security.application-groups'],
            appGroupIdentifier
        );

        return entitlementsConfig;
    });

    config = withInfoPlist(config, infoPlistConfig => {
        infoPlistConfig.modResults[INFO_PLIST_KEY] = appGroupIdentifier;

        return infoPlistConfig;
    });

    config = withDangerousMod(config, ['ios', copySwiftFile]);

    return withXcodeProject(config, projectConfig =>
        addSwiftFileToXcodeProject(projectConfig, path.join(projectConfig.modRequest.projectName, SWIFT_FILE_NAME))
    );
};
