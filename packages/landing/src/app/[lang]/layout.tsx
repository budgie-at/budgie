import '../../../styles/globals.css';
import { msg } from '@lingui/core/macro';
import localFont from 'next/font/local';

import { Footer } from '../../generic/component/footer/footer';
import { Header } from '../../generic/component/header/header';
import { JsonLd } from '../../generic/component/json-ld/json-ld';
import { BASE_URL, OG_LOCALE_MAP } from '../../generic/constant/seo.constant';
import { buildAlternates } from '../../generic/util/build-alternates.util';
import { clientMessages, getI18nInstance } from '../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../i18n/init-lingui';
import { LinguiClientProvider } from '../../i18n/lingui-client.provider';
import { SUPPORTED_LOCALES } from '../../i18n/supported-locales.constant.mjs';
import { ThemeProvider } from '../../providers/theme-provider';

import type { Viewport } from 'next';
import type { ReactNode } from 'react';

const fixelDisplay = localFont({
    src: [
        {
            path: '../fonts/fixel-display/fixel-display-regular.woff2',
            weight: '400',
            style: 'normal'
        },
        {
            path: '../fonts/fixel-display/fixel-display-medium.woff2',
            weight: '500',
            style: 'normal'
        },
        {
            path: '../fonts/fixel-display/fixel-display-semi-bold.woff2',
            weight: '600',
            style: 'normal'
        },
        {
            path: '../fonts/fixel-display/fixel-display-bold.woff2',
            weight: '700',
            style: 'normal'
        }
    ],
    display: 'swap'
});

interface Props extends PageLangParam {
    children: ReactNode;
}

// eslint-disable-next-line func-style
export async function generateStaticParams() {
    return SUPPORTED_LOCALES.map(lang => ({ lang }));
}

export const viewport: Viewport = {
    themeColor: [
        // oxlint-disable-next-line lingui/no-unlocalized-strings
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        // oxlint-disable-next-line lingui/no-unlocalized-strings
        { media: '(prefers-color-scheme: dark)', color: '#09090b' }
    ],
    viewportFit: 'cover'
};

// eslint-disable-next-line func-style
export async function generateMetadata(props: Props) {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    const siteTitle = i18n._(msg`Budgie - Privacy-First Expense Tracker`);
    const shortDescription = i18n._(
        msg`Track expenses, sync banks, manage crypto & stocks with complete privacy. Multi-currency support, debt tracking, and AI insights.`
    );

    return {
        metadataBase: new URL(BASE_URL),
        title: {
            default: siteTitle,
            // oxlint-disable-next-line lingui/no-unlocalized-strings
            template: '%s | Budgie'
        },
        description: i18n._(
            msg`Track expenses, sync banks, and manage crypto with full privacy. Multi-currency, debt tracking, and on-device AI insights — stored on your device.`
        ),
        keywords: i18n._(
            msg`expense tracker, budget app, bank sync, crypto tracking, privacy, offline-first, multi-currency, debt tracking, financial management`
        ),
        authors: [{ name: i18n._(msg`Budgie Team`) }],
        creator: i18n._(msg`Budgie`),
        publisher: i18n._(msg`Budgie`),
        // oxlint-disable-next-line lingui/no-unlocalized-strings
        robots: 'index, follow',
        alternates: buildAlternates(lang, ''),
        openGraph: {
            title: siteTitle,
            description: shortDescription,
            type: 'website',
            url: `${BASE_URL}/${lang}`,
            locale: OG_LOCALE_MAP[lang] ?? 'en_US'
        },
        twitter: {
            card: 'summary_large_image',
            title: siteTitle,
            description: shortDescription,

            site: '@budgie_at',

            creator: '@budgie_at'
        }
    };
}

export default async function RootLayout({ params, children }: Props) {
    const { lang } = await params;

    initLingui(lang);

    /* oxlint-disable lingui/no-unlocalized-strings */
    const organizationData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Budgie',
        url: BASE_URL,
        description: 'Developer of Budgie, a privacy-first offline expense tracker for iOS and Android.',
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo/black-on-white.svg`, width: 200, height: 60 },
        sameAs: ['https://github.com/budgie-at/budgie', 'https://x.com/budgie_at']
    };

    const websiteData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Budgie',
        url: BASE_URL
    };
    /* oxlint-enable lingui/no-unlocalized-strings */

    return (
        <html lang={lang} suppressHydrationWarning>
            <body className={fixelDisplay.className}>
                <JsonLd data={organizationData} />
                <JsonLd data={websiteData} />

                <LinguiClientProvider initialLocale={lang} initialMessages={clientMessages[lang]}>
                    <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
                        <div className="flex min-h-dvh flex-col">
                            <Header lang={lang} />
                            {children}
                            <Footer lang={lang} />
                        </div>
                    </ThemeProvider>
                </LinguiClientProvider>
            </body>
        </html>
    );
}
