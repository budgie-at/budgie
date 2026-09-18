// Build phases and settings shared by every iOS app-extension target in this app.

const FALLBACK_DEPLOYMENT_TARGET = '"16.0"';

const readAppDeploymentTarget = project => {
    const configurations = project.pbxXCBuildConfigurationSection();

    for (const key of Object.keys(configurations)) {
        const deploymentTarget = configurations[key].buildSettings?.IPHONEOS_DEPLOYMENT_TARGET;

        if (deploymentTarget !== undefined) {
            return typeof deploymentTarget === 'string' ? deploymentTarget : `"${deploymentTarget}"`;
        }
    }

    return FALLBACK_DEPLOYMENT_TARGET;
};

const addTargetGroup = (project, targetName, groupFiles) => {
    const group = project.addPbxGroup(groupFiles, targetName, targetName);
    const groups = project.hash.project.objects.PBXGroup;

    for (const key of Object.keys(groups)) {
        if (groups[key].name === undefined && groups[key].path === undefined) {
            project.addToPbxGroup(group.uuid, key);
        }
    }
};

const applyBuildSettings = (project, xcodeConfig, { targetName, bundleId, entitlementsFile, deploymentTarget }) => {
    const marketingVersion = xcodeConfig.version;
    const currentProjectVersion = xcodeConfig.ios?.buildNumber ?? '1';
    const configurations = project.pbxXCBuildConfigurationSection();

    for (const key of Object.keys(configurations)) {
        const settings = configurations[key].buildSettings;

        if (settings === undefined || settings.PRODUCT_NAME !== `"${targetName}"`) {
            continue;
        }

        if (marketingVersion !== undefined) {
            settings.MARKETING_VERSION = marketingVersion;
        }

        settings.CURRENT_PROJECT_VERSION = currentProjectVersion;
        settings.INFOPLIST_FILE = `"${targetName}/Info.plist"`;
        settings.PRODUCT_BUNDLE_IDENTIFIER = `"${bundleId}"`;

        if (entitlementsFile !== undefined) {
            settings.CODE_SIGN_ENTITLEMENTS = `"${targetName}/${entitlementsFile}"`;
        }

        settings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;
        settings.SWIFT_VERSION = '"5.0"';
        settings.TARGETED_DEVICE_FAMILY = '"1"';
        settings.CODE_SIGN_STYLE = 'Automatic';
        settings.SWIFT_OPTIMIZATION_LEVEL = '"-Onone"';
    }
};

function addAppExtensionTarget(project, xcodeConfig, { targetName, bundleId, sourceFiles, groupFiles, resourceFiles, entitlementsFile }) {
    const deploymentTarget = readAppDeploymentTarget(project);

    addTargetGroup(project, targetName, groupFiles ?? sourceFiles);

    const target = project.addTarget(targetName, 'app_extension', targetName, bundleId);

    project.addBuildPhase(sourceFiles, 'PBXSourcesBuildPhase', 'Sources', target.uuid);
    project.addBuildPhase(resourceFiles ?? [], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
    project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);

    applyBuildSettings(project, xcodeConfig, {
        targetName,
        bundleId,
        entitlementsFile,
        deploymentTarget
    });
}

module.exports = { addAppExtensionTarget };
