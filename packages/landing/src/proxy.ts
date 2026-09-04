import Negotiator from 'negotiator';
import { type NextRequest, NextResponse } from 'next/server';

import { isNotEmptyString } from '@rnw-community/shared';

import { SUPPORTED_LOCALES as locales } from './i18n/supported-locales.constant.mjs';

const PERMANENT_REDIRECT_STATUS = 301;

const getRequestLocale = (requestHeaders: Headers): string => {
    const langHeader = requestHeaders.get('accept-language');

    if (!isNotEmptyString(langHeader)) {
        return 'en';
    }

    const languages = new Negotiator({ headers: { 'accept-language': langHeader } }).languages(locales.slice());

    return languages[0] || 'en';
};

// eslint-disable-next-line func-style,no-implicit-globals
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const pathnameHasLocale = locales.some(locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);

    if (pathnameHasLocale) {
        return;
    }

    const locale = getRequestLocale(request.headers);
    request.nextUrl.pathname = `/${locale}${pathname}`;

    // eslint-disable-next-line consistent-return
    return NextResponse.redirect(request.nextUrl, PERMANENT_REDIRECT_STATUS);
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|ota/manifest\\.plist|.well-known|[^/]+\\.\\w+$).*)'
    ]
};
