/*
 * For more info see
 * https://nextjs.org/docs/app/building-your-application/routing/internationalization
 * */
import Negotiator from 'negotiator';
import { type NextRequest, NextResponse } from 'next/server';

import linguiConfig from '../../lingui.config.mjs';

const { locales } = linguiConfig;

const getRequestLocale = (requestHeaders: Headers): string => {
    // eslint-disable-next-line no-undefined
    const langHeader = requestHeaders.get('accept-language') || undefined;

    const languages = new Negotiator({ headers: { 'accept-language': langHeader } }).languages(locales.slice());

    const activeLocale = languages[0] || locales[0] || 'en';

    return activeLocale;
};

// eslint-disable-next-line func-style,no-implicit-globals
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const pathnameHasLocale = locales.some(locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);

    if (pathnameHasLocale) {
        return;
    }

    // Redirect if there is no locale
    const locale = getRequestLocale(request.headers);
    request.nextUrl.pathname = `/${locale}${pathname}`;

    // e.g. incoming request is /products
    // The new URL is now /en/products
    NextResponse.redirect(request.nextUrl);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
    ]
};
