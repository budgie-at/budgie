import { z } from 'zod';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { IosDevReleaseSchema } from '../constant/ios-dev-release-schema.constant';

import { findIosDevIpaDownloadUrl } from './find-ios-dev-ipa-download-url.util';

import type { IosDevRelease } from '../constant/ios-dev-release-schema.constant';

const IOS_DEV_RELEASES_URL = 'https://api.github.com/repos/budgie-at/budgie/releases?per_page=20';
const DEV_IOS_TAG_PATTERN = /^dev-ios-(\d+)$/u;
const LEGACY_IOS_DEV_TAG_PATTERN = /^ios-dev-(\d+)$/u;
const RUN_NUMBER_SORT_MULTIPLIER = 2;
const PREFERRED_SCHEME_SORT_BONUS = 1;

const isIosDevReleaseTag = (tagName: string): boolean =>
    DEV_IOS_TAG_PATTERN.test(tagName) || LEGACY_IOS_DEV_TAG_PATTERN.test(tagName);

const iosDevTagSortWeight = (tagName: string): number => {
    const preferredSchemeMatch = DEV_IOS_TAG_PATTERN.exec(tagName);
    if (isDefined(preferredSchemeMatch)) {
        return Number(preferredSchemeMatch[1]) * RUN_NUMBER_SORT_MULTIPLIER + PREFERRED_SCHEME_SORT_BONUS;
    }

    const legacySchemeMatch = LEGACY_IOS_DEV_TAG_PATTERN.exec(tagName);

    return isDefined(legacySchemeMatch) ? Number(legacySchemeMatch[1]) * RUN_NUMBER_SORT_MULTIPLIER : 0;
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
            .filter(release => isIosDevReleaseTag(release.tag_name) && isDefined(findIosDevIpaDownloadUrl(release)))
            .sort((releaseA, releaseB) => iosDevTagSortWeight(releaseB.tag_name) - iosDevTagSortWeight(releaseA.tag_name));

        return isNotEmptyArray(iosDevReleases) ? iosDevReleases[0] : null;
    } catch {
        return null;
    }
};
