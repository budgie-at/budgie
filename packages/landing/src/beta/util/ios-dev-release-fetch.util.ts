import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { IosDevReleaseSchema } from '../constant/ios-dev-release-schema.constant';
import { IOS_DEV_BUILD_META_ASSET_NAME, IOS_DEV_RELEASE_TAG_PREFIX } from '../constant/ios-dev-release-tag.constant';

import { githubJsonFetch } from './github-json-fetch.util';

import type { IosDevRelease } from '../constant/ios-dev-release-schema.constant';

const GITHUB_REPO_API_URL = 'https://api.github.com/repos/budgie-at/budgie';
const MATCHING_DEV_TAG_REFS_URL = `${GITHUB_REPO_API_URL}/git/matching-refs/tags/${IOS_DEV_RELEASE_TAG_PREFIX}?per_page=100`;
const TAG_REF_PREFIX = 'refs/tags/';
const GitRefsSchema = Schema.Array(Schema.Struct({ ref: Schema.String }));
const DEV_TAG_RUN_NUMBER_REGEX = /^\d+$/u;

const hasBuildMetaAsset = (release: IosDevRelease): boolean => release.assets.some(asset => asset.name === IOS_DEV_BUILD_META_ASSET_NAME);

const tagNameToRunNumber = (tagName: string): number => {
    const runNumberPart = tagName.slice(IOS_DEV_RELEASE_TAG_PREFIX.length);

    return DEV_TAG_RUN_NUMBER_REGEX.test(runNumberPart) ? Number.parseInt(runNumberPart, 10) : NaN;
};

const latestDevTagNameFetchApi = Effect.fnUntraced(function* (requestInit: RequestInit) {
    const gitRefs = yield* githubJsonFetch(MATCHING_DEV_TAG_REFS_URL, GitRefsSchema, requestInit);

    if (!isDefined(gitRefs)) {
        return null;
    }

    const runNumberTagNameEntries = gitRefs
        .map(gitRef => gitRef.ref.slice(TAG_REF_PREFIX.length))
        .map(tagName => ({ runNumber: tagNameToRunNumber(tagName), tagName }))
        .filter(entry => isPositiveNumber(entry.runNumber))
        .sort((entryA, entryB) => entryB.runNumber - entryA.runNumber);

    return isNotEmptyArray(runNumberTagNameEntries) ? runNumberTagNameEntries[0].tagName : null;
});

export const iosDevReleaseFetchApi = Effect.fnUntraced(function* (requestInit: RequestInit) {
    const tagName = yield* latestDevTagNameFetchApi(requestInit);

    if (!isDefined(tagName)) {
        return null;
    }

    const release = yield* githubJsonFetch(`${GITHUB_REPO_API_URL}/releases/tags/${tagName}`, IosDevReleaseSchema, requestInit);

    return isDefined(release) && hasBuildMetaAsset(release) ? release : null;
});
