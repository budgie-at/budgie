import { z } from 'zod';

import { isNotEmptyArray } from '@rnw-community/shared';

import { IosDevReleaseSchema } from '../constant/ios-dev-release-schema.constant';
import { IOS_DEV_BUILD_META_ASSET_NAME, IOS_DEV_RELEASE_TAG_PREFIX } from '../constant/ios-dev-release-tag.constant';

import type { IosDevRelease } from '../constant/ios-dev-release-schema.constant';

const IOS_DEV_RELEASES_URL = 'https://api.github.com/repos/budgie-at/budgie/releases?per_page=20';

const hasBuildMetaAsset = (release: IosDevRelease): boolean => release.assets.some(asset => asset.name === IOS_DEV_BUILD_META_ASSET_NAME);

export const iosDevReleaseFetchApi = async (requestInit: RequestInit): Promise<IosDevRelease | null> => {
    try {
        const response = await fetch(IOS_DEV_RELEASES_URL, requestInit);

        if (!response.ok) {
            return null;
        }

        const releasesJson: unknown = await response.json();
        const parseResult = z.array(IosDevReleaseSchema).safeParse(releasesJson);

        if (!parseResult.success) {
            return null;
        }

        const iosDevReleases = parseResult.data
            .filter(release => !release.draft && release.tag_name.startsWith(IOS_DEV_RELEASE_TAG_PREFIX) && hasBuildMetaAsset(release))
            .sort((releaseA, releaseB) => Date.parse(releaseB.created_at) - Date.parse(releaseA.created_at));

        return isNotEmptyArray(iosDevReleases) ? iosDevReleases[0] : null;
    } catch {
        return null;
    }
};
