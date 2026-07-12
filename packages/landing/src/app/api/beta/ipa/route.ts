/* eslint-disable lingui/no-unlocalized-strings */
import { NextResponse } from 'next/server';

import { isDefined } from '@rnw-community/shared';

import { findIosDevIpaDownloadUrl } from '../../../../beta/util/find-ios-dev-ipa-download-url.util';
import { iosDevReleaseFetchApi } from '../../../../beta/util/ios-dev-release-fetch.util';

const NO_STORE_CACHE_CONTROL_HEADER = 'no-store';
const REDIRECT_STATUS = 302;
const NOT_FOUND_STATUS = 404;

export const dynamic = 'force-dynamic';

// eslint-disable-next-line func-style,no-implicit-globals -- Next.js route handlers must be exported functions
export async function GET(): Promise<NextResponse> {
    const release = await iosDevReleaseFetchApi({ cache: 'no-store' });
    const ipaDownloadUrl = isDefined(release) ? findIosDevIpaDownloadUrl(release) : null;

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
