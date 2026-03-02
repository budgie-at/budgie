const { withXcodeProject } = require('expo/config-plugins');

const VEC_COPY_SCRIPT = `
# Pre-copy vec.xcframework to prevent race condition with parallel builds.
# The [CP] Copy XCFrameworks phase on the ExpoSQLite pod target can race
# with the main app linking step. This script ensures vec.framework is
# available before linking starts.
VEC_SRC="\${PODS_ROOT}/../../../../node_modules/expo-sqlite/ios/vec.xcframework"
DEST="\${PODS_XCFRAMEWORKS_BUILD_DIR}/ExpoSQLite"
if [ -d "$VEC_SRC" ]; then
  SLICE="ios-arm64"
  if [[ "$PLATFORM_NAME" == *simulator* ]]; then
    SLICE="ios-arm64-simulator"
  fi
  if [ ! -f "$DEST/vec.framework/vec" ]; then
    mkdir -p "$DEST"
    cp -R "$VEC_SRC/$SLICE/vec.framework" "$DEST/"
    echo "Pre-copied vec.framework ($SLICE) to $DEST"
  fi
fi
`;

module.exports = function withVecXcframeworkFix(config) {
    return withXcodeProject(config, projectConfig => {
        const project = projectConfig.modResults;
        const targetUuid = project.getFirstTarget().uuid;

        project.addBuildPhase([], 'PBXShellScriptBuildPhase', 'Pre-copy vec.xcframework for ExpoSQLite', targetUuid, {
            shellPath: '/bin/sh',
            shellScript: VEC_COPY_SCRIPT
        });

        const nativeTarget = project.pbxNativeTargetSection()[targetUuid];
        if (nativeTarget?.buildPhases) {
            const phases = nativeTarget.buildPhases;
            const addedPhase = phases.pop();
            phases.unshift(addedPhase);
        }

        return projectConfig;
    });
};
