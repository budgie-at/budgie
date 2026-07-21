import { isDefined } from '@rnw-community/shared';

import type { IosDevRelease } from '../constant/ios-dev-release-schema.constant';

const IOS_DEV_IPA_ASSET_SUFFIX = '.ipa';

export const findIosDevIpaDownloadUrl = (release: IosDevRelease): string | null => {
    const ipaAsset = release.assets.find(asset => asset.name.endsWith(IOS_DEV_IPA_ASSET_SUFFIX));

    return isDefined(ipaAsset) ? ipaAsset.browser_download_url : null;
};
