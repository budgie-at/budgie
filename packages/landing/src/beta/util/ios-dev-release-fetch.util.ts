import { z } from 'zod';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { IosDevReleaseSchema } from '../constant/ios-dev-release-schema.constant';
import { IOS_DEV_BUILD_META_ASSET_NAME, IOS_DEV_RELEASE_TAG_PREFIX } from '../constant/ios-dev-release-tag.constant';

import type { IosDevRelease } from '../constant/ios-dev-release-schema.constant';

const GITHUB_REPO_API_URL = 'https://api.github.com/repos/budgie-at/budgie';
const MATCHING_DEV_TAG_REFS_URL = `${GITHUB_REPO_API_URL}/git/matching-refs/tags/${IOS_DEV_RELEASE_TAG_PREFIX}?per_page=100`;
const TAG_REF_PREFIX = 'refs/tags/';
const DEV_TAG_RUN_NUMBER_REGEX = /^\d+$/u;

const hasBuildMetaAsset = (release: IosDevRelease): boolean => release.assets.some(asset => asset.name === IOS_DEV_BUILD_META_ASSET_NAME);

const tagNameToRunNumber = (tagName: string): number => {
    const runNumberPart = tagName.slice(IOS_DEV_RELEASE_TAG_PREFIX.length);

    return DEV_TAG_RUN_NUMBER_REGEX.test(runNumberPart) ? Number.parseInt(runNumberPart, 10) : NaN;
};

const latestDevTagNameFetchApi = async (requestInit: RequestInit): Promise<string | null> => {
    try {
        const response = await fetch(MATCHING_DEV_TAG_REFS_URL, requestInit);

        if (!response.ok) {
            return null;
        }

        const refsJson: unknown = await response.json();
        const parseResult = z.array(z.object({ ref: z.string() })).safeParse(refsJson);

        if (!parseResult.success) {
            return null;
        }

        const runNumberTagNameEntries = parseResult.data
            .map(gitRef => gitRef.ref.slice(TAG_REF_PREFIX.length))
            .map(tagName => ({ runNumber: tagNameToRunNumber(tagName), tagName }))
            .filter(entry => isPositiveNumber(entry.runNumber))
            .sort((entryA, entryB) => entryB.runNumber - entryA.runNumber);

        return isNotEmptyArray(runNumberTagNameEntries) ? runNumberTagNameEntries[0].tagName : null;
    } catch {
        return null;
    }
};

export const iosDevReleaseFetchApi = async (requestInit: RequestInit): Promise<IosDevRelease | null> => {
    const tagName = await latestDevTagNameFetchApi(requestInit);

    if (!isDefined(tagName)) {
        return null;
    }

    try {
        const response = await fetch(`${GITHUB_REPO_API_URL}/releases/tags/${tagName}`, requestInit);

        if (!response.ok) {
            return null;
        }

        const releaseJson: unknown = await response.json();
        const parseResult = IosDevReleaseSchema.safeParse(releaseJson);

        return parseResult.success && hasBuildMetaAsset(parseResult.data) ? parseResult.data : null;
    } catch {
        return null;
    }
};
