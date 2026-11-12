/* oxlint-disable lingui/no-unlocalized-strings */
import * as Effect from 'effect/Effect';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Schema from 'effect/Schema';
import { NextResponse } from 'next/server';

import { isDefined } from '@rnw-community/shared';

import { githubJsonFetch } from '../../../../beta/utils/github-json-fetch.util';

const ANDROID_RELEASES_URL = 'https://api.github.com/repos/budgie-at/budgie/releases?per_page=30';
const ANDROID_PREVIEW_RELEASE_TAG_PREFIX = 'android-preview-';
const APK_EXTENSION = '.apk';
const AndroidPreviewReleaseListSchema = Schema.Array(
    Schema.Struct({
        tag_name: Schema.String,
        assets: Schema.Array(Schema.Struct({ name: Schema.String, browser_download_url: Schema.String }))
    })
);
const NO_STORE_CACHE_CONTROL_HEADER = 'no-store';
const REDIRECT_STATUS = 302;
const NOT_FOUND_STATUS = 404;

const resolveApkDownloadUrl = Effect.fnUntraced(function* () {
    const releases = yield* githubJsonFetch(ANDROID_RELEASES_URL, AndroidPreviewReleaseListSchema, { cache: 'no-store' });

    if (!isDefined(releases)) {
        return null;
    }

    const apkAsset = releases
        .filter(release => release.tag_name.startsWith(ANDROID_PREVIEW_RELEASE_TAG_PREFIX))
        .flatMap(release => release.assets)
        .find(asset => asset.name.endsWith(APK_EXTENSION));

    return isDefined(apkAsset) ? apkAsset.browser_download_url : null;
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
