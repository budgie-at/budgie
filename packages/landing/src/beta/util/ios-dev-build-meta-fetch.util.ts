import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { isDefined } from '@rnw-community/shared';

import { IosDevBuildMetaSchema } from '../constant/ios-dev-build-meta-schema.constant';
import { IOS_DEV_BUILD_META_ASSET_NAME } from '../constant/ios-dev-release-tag.constant';

import { findIosDevReleaseAssetUrl } from './find-ios-dev-release-asset-url.util';

import type { IosDevBuildMeta } from '../constant/ios-dev-build-meta-schema.constant';
import type { IosDevRelease } from '../constant/ios-dev-release-schema.constant';

export const iosDevBuildMetaFetchApi = async (release: IosDevRelease, requestInit: RequestInit): Promise<IosDevBuildMeta | null> => {
    const buildMetaUrl = findIosDevReleaseAssetUrl(release, IOS_DEV_BUILD_META_ASSET_NAME);

    if (!isDefined(buildMetaUrl)) {
        return null;
    }

    try {
        const response = await fetch(buildMetaUrl, requestInit);

        if (!response.ok) {
            return null;
        }

        const buildMetaJson: unknown = await response.json();

        return Schema.decodeUnknownOption(IosDevBuildMetaSchema)(buildMetaJson).pipe(Option.getOrNull);
    } catch {
        return null;
    }
};
