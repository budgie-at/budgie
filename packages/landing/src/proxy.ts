import Negotiator from 'negotiator';
import { type NextRequest, NextResponse } from 'next/server';

import linguiConfig from '../lingui.config.mjs';

const { locales } = linguiConfig;

const PERMANENT_REDIRECT_STATUS = 301;

const getRequestLocale = (requestHeaders: Headers): string => {
    // eslint-disable-next-line no-undefined
    const langHeader = requestHeaders.get('accept-language') || undefined;

    const languages = new Negotiator({ headers: { 'accept-language': langHeader } }).languages(locales.slice());

    return languages[0] || locales[0] || 'en';
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
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.well-known|[^.]*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
    ]
};
