const { withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const SCENE_DELEGATE_CLASS = 'class SceneDelegate: ExpoAppSceneDelegate {';
const INSTALLED_MARKER = 'ICloudShareInbox';
const IMPORTS = 'import CloudKit\nimport ICloud\nimport UIKit\n';
const OVERRIDES = `
  override func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    super.scene(scene, willConnectTo: session, options: connectionOptions)
    if let metadata = connectionOptions.cloudKitShareMetadata {
      ICloudShareInbox.shared.receive(metadata)
    }
  }

  func windowScene(_ windowScene: UIWindowScene, userDidAcceptCloudKitShareWith cloudKitShareMetadata: CKShare.Metadata) {
    ICloudShareInbox.shared.receive(cloudKitShareMetadata)
  }
`;

module.exports = config =>
    withDangerousMod(config, [
        'ios',
        mod => {
            const sceneDelegatePath = path.join(mod.modRequest.platformProjectRoot, mod.modRequest.projectName, 'SceneDelegate.swift');
            const source = fs.readFileSync(sceneDelegatePath, 'utf8');

            if (source.includes(INSTALLED_MARKER)) {
                return mod;
            }

            if (!source.includes(SCENE_DELEGATE_CLASS)) {
                throw new Error(`with-icloud-share-acceptance: ${SCENE_DELEGATE_CLASS} not found in ${sceneDelegatePath}`);
            }

            fs.writeFileSync(sceneDelegatePath, IMPORTS + source.replace(SCENE_DELEGATE_CLASS, SCENE_DELEGATE_CLASS + OVERRIDES));

            return mod;
        }
    ]);
