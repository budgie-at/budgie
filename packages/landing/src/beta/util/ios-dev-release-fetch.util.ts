import { z } from 'zod';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { IosDevReleaseSchema } from '../constant/ios-dev-release-schema.constant';

import { findIosDevIpaDownloadUrl } from './find-ios-dev-ipa-download-url.util';

import type { IosDevRelease } from '../constant/ios-dev-release-schema.constant';

const IOS_DEV_RELEASES_URL = 'https://api.github.com/repos/budgie-at/budgie/releases?per_page=20';
const IOS_DEV_TAG_PATTERN = /^ios-dev-(\d+)$/u;

const parseIosDevRunNumber = (tagName: string): number => {
    const match = IOS_DEV_TAG_PATTERN.exec(tagName);

    return isDefined(match) ? Number(match[1]) : 0;
};

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
            .filter(release => IOS_DEV_TAG_PATTERN.test(release.tag_name) && isDefined(findIosDevIpaDownloadUrl(release)))
            .sort((releaseA, releaseB) => parseIosDevRunNumber(releaseB.tag_name) - parseIosDevRunNumber(releaseA.tag_name));

        return isNotEmptyArray(iosDevReleases) ? iosDevReleases[0] : null;
    } catch {
        return null;
    }
};
