/* oxlint-disable lingui/no-unlocalized-strings */
import { NextResponse } from 'next/server';

import { isDefined } from '@rnw-community/shared';

import { findIosDevReleaseAssetUrl } from '../../../../beta/util/find-ios-dev-release-asset-url.util';
import { iosDevBuildMetaFetchApi } from '../../../../beta/util/ios-dev-build-meta-fetch.util';
import { iosDevReleaseFetchApi } from '../../../../beta/util/ios-dev-release-fetch.util';

const NO_STORE_CACHE_CONTROL_HEADER = 'no-store';
const REDIRECT_STATUS = 302;
const NOT_FOUND_STATUS = 404;

const resolveIpaDownloadUrl = async (): Promise<string | null> => {
    const release = await iosDevReleaseFetchApi({ cache: 'no-store' });

    if (!isDefined(release)) {
        return null;
    }

    const buildMeta = await iosDevBuildMetaFetchApi(release, { cache: 'no-store' });

    return isDefined(buildMeta) ? findIosDevReleaseAssetUrl(release, buildMeta.assetName) : null;
};

// eslint-disable-next-line func-style,no-implicit-globals -- Next.js route handlers must be exported functions
export async function GET(): Promise<NextResponse> {
    const ipaDownloadUrl = await resolveIpaDownloadUrl();

    if (!isDefined(ipaDownloadUrl)) {
        return NextResponse.json(
            { error: 'No iOS dev build is available yet' },
            { status: NOT_FOUND_STATUS, headers: { 'Cache-Control': NO_STORE_CACHE_CONTROL_HEADER } }
        );
    }

    const redirectResponse = NextResponse.redirect(ipaDownloadUrl, { status: REDIRECT_STATUS });
    redirectResponse.headers.set('Cache-Control', NO_STORE_CACHE_CONTROL_HEADER);

    return redirectResponse;
}
