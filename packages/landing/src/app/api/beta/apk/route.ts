/* oxlint-disable lingui/no-unlocalized-strings */
import * as Effect from 'effect/Effect';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Schema from 'effect/Schema';
import { NextResponse } from 'next/server';

import { isDefined } from '@rnw-community/shared';

import { githubJsonFetch } from '../../../../beta/utils/github-json-fetch.util';

const GITHUB_REPO_API_URL = 'https://api.github.com/repos/budgie-at/budgie';
const ANDROID_PREVIEW_TAG_REFS_URL = `${GITHUB_REPO_API_URL}/git/matching-refs/tags/android-preview-`;
const TAG_REF_PREFIX = 'refs/tags/';
const APK_EXTENSION = '.apk';
const AndroidPreviewTagRefListSchema = Schema.Array(Schema.Struct({ ref: Schema.String }));
const AndroidPreviewReleaseSchema = Schema.Struct({
    assets: Schema.Array(Schema.Struct({ name: Schema.String, browser_download_url: Schema.String }))
});
const NO_STORE_REQUEST_INIT: RequestInit = { cache: 'no-store' };
const NO_STORE_CACHE_CONTROL_HEADER = 'no-store';
const REDIRECT_STATUS = 302;
const NOT_FOUND_STATUS = 404;

const resolveApkDownloadUrl = Effect.fnUntraced(function* () {
    const tagRefs = yield* githubJsonFetch(ANDROID_PREVIEW_TAG_REFS_URL, AndroidPreviewTagRefListSchema, NO_STORE_REQUEST_INIT);
    const latestTagRef = tagRefs?.at(-1);

    if (!isDefined(latestTagRef)) {
        return null;
    }

    const release = yield* githubJsonFetch(
        `${GITHUB_REPO_API_URL}/releases/tags/${latestTagRef.ref.slice(TAG_REF_PREFIX.length)}`,
        AndroidPreviewReleaseSchema,
        NO_STORE_REQUEST_INIT
    );

    return release?.assets.find(asset => asset.name.endsWith(APK_EXTENSION))?.browser_download_url ?? null;
});

// eslint-disable-next-line func-style -- Next.js route handlers must be exported functions
export async function GET(): Promise<NextResponse> {
    const apkDownloadUrl = await Effect.runPromise(resolveApkDownloadUrl().pipe(Effect.provide(FetchHttpClient.layer)));

    if (!isDefined(apkDownloadUrl)) {
        return NextResponse.json(
            { error: 'No Android preview build is available yet' },
            { status: NOT_FOUND_STATUS, headers: { 'Cache-Control': NO_STORE_CACHE_CONTROL_HEADER } }
        );
    }

    const redirectResponse = NextResponse.redirect(apkDownloadUrl, { status: REDIRECT_STATUS });
    redirectResponse.headers.set('Cache-Control', NO_STORE_CACHE_CONTROL_HEADER);

    return redirectResponse;
}
