import '../../../styles/globals.css';
import { msg } from '@lingui/core/macro';
import localFont from 'next/font/local';

import linguiConfig from '../../../lingui.config.mjs';
import { Footer } from '../../generic/component/footer/footer';
import { Header } from '../../generic/component/header/header';
import { JsonLd } from '../../generic/component/json-ld/json-ld';
import { BASE_URL, OG_LOCALE_MAP } from '../../generic/constant/seo.constant';
import { buildAlternates } from '../../generic/util/build-alternates.util';
import { allMessages, getI18nInstance } from '../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../i18n/init-lingui';
import { LinguiClientProvider } from '../../i18n/lingui-client.provider';
import { ThemeProvider } from '../../providers/theme-provider';

import type { ReactNode } from 'react';

const fixelDisplay = localFont({
    src: [
        {
            path: '../fonts/fixel-display/fixel-display-regular.woff2',
            weight: '400',
            style: 'normal'
        },
        {
            path: '../fonts/fixel-display/fixel-display-regular-italic.woff2',
            weight: '400',
            style: 'italic'
        },
        {
            path: '../fonts/fixel-display/fixel-display-medium.woff2',
            weight: '500',
            style: 'normal'
        },
        {
            path: '../fonts/fixel-display/fixel-display-medium-italic.woff2',
            weight: '500',
            style: 'italic'
        },
        {
            path: '../fonts/fixel-display/fixel-display-semi-bold.woff2',
            weight: '600',
            style: 'normal'
        },
        {
            path: '../fonts/fixel-display/fixel-display-semi-bold-italic.woff2',
            weight: '600',
            style: 'italic'
        },
        {
            path: '../fonts/fixel-display/fixel-display-bold.woff2',
            weight: '700',
            style: 'normal'
        },
        {
            path: '../fonts/fixel-display/fixel-display-bold-italic.woff2',
            weight: '700',
            style: 'italic'
        }
    ],
    display: 'swap'
});

interface Props extends PageLangParam {
    children: ReactNode;
}

// eslint-disable-next-line func-style
export async function generateStaticParams() {
    return linguiConfig.locales.map(lang => ({ lang }));
}

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
            // eslint-disable-next-line lingui/no-unlocalized-strings
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
        // eslint-disable-next-line lingui/no-unlocalized-strings
        robots: 'index, follow',
        alternates: buildAlternates(lang, ''),
        openGraph: {
            title: siteTitle,
            description: shortDescription,
            type: 'website',
            url: `${BASE_URL}/${lang}`,
            locale: OG_LOCALE_MAP[lang] ?? 'en_US',
            images: [{ url: `${BASE_URL}/images/design-mode/ai-budgeting-app-4x.jpg`, width: 1200, height: 630 }]
        },
        twitter: {
            card: 'summary_large_image',
            title: siteTitle,
            description: shortDescription,
            images: [`${BASE_URL}/images/design-mode/ai-budgeting-app-4x.jpg`],

            site: '@budgie_at',

            creator: '@budgie_at'
        }
    };
}

export default async function RootLayout({ params, children }: Props) {
    const { lang } = await params;

    initLingui(lang);

    /* eslint-disable lingui/no-unlocalized-strings */
    const organizationData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Budgie',
        url: BASE_URL,
        logo: `${BASE_URL}/logo/black-on-white.svg`,
        sameAs: ['https://github.com/budgie-at/budgie', 'https://x.com/budgie_at']
    };

    const websiteData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Budgie',
        url: BASE_URL
    };
    /* eslint-enable lingui/no-unlocalized-strings */

    return (
        <html lang={lang} suppressHydrationWarning>
            <body className={fixelDisplay.className}>
                <JsonLd data={organizationData} />
                <JsonLd data={websiteData} />

                <LinguiClientProvider initialLocale={lang} initialMessages={allMessages[lang]}>
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
