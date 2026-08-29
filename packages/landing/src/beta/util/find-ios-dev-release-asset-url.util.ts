import { isDefined } from '@rnw-community/shared';

import type { IosDevRelease } from '../constant/ios-dev-release-schema.constant';

export const findIosDevReleaseAssetUrl = (release: IosDevRelease, assetName: string): string | null => {
    const asset = release.assets.find(releaseAsset => releaseAsset.name === assetName);

    return isDefined(asset) ? asset.browser_download_url : null;
};
