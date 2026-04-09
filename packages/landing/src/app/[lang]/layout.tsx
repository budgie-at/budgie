import '../../../styles/globals.css';
import { msg } from '@lingui/core/macro';
import localFont from 'next/font/local';

import linguiConfig from '../../../lingui.config.mjs';
import { Footer } from '../../generic/component/footer/footer';
import { Header } from '../../generic/component/header/header';
import { JsonLd } from '../../generic/component/json-ld/json-ld';
import { allMessages, getI18nInstance } from '../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../i18n/init-lingui';
import { LinguiClientProvider } from '../../i18n/lingui-client.provider';
import { ThemeProvider } from '../../providers/theme-provider';

import type { ReactNode } from 'react';

/* eslint-disable lingui/no-unlocalized-strings */
const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Budgie',
    url: 'https://budgie.app',
    logo: 'https://budgie.app/logo/black-on-white.svg',
    sameAs: ['https://github.com/budgie-at/budgie', 'https://x.com/budgie_at']
};

const createWebSiteSchema = (lang: string) => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Budgie',
    url: 'https://budgie.app',
    potentialAction: {
        '@type': 'SearchAction',
        target: `https://budgie.app/${lang}/blog?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
    }
});
/* eslint-enable lingui/no-unlocalized-strings */

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
    ]
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

    return {
        title: {
            default: i18n._(msg`Budgie - Privacy-First Expense Tracker`),
            // eslint-disable-next-line lingui/no-unlocalized-strings
            template: '%s | Budgie'
        },
        description: i18n._(
            msg`Track expenses, sync banks, manage crypto & stocks with complete privacy. Multi-currency support, debt tracking, and AI insights - all stored securely on your device.`
        ),
        keywords: i18n._(
            msg`expense tracker, budget app, bank sync, crypto tracking, privacy, offline-first, multi-currency, debt tracking, financial management`
        ),
        authors: [{ name: i18n._(msg`Budgie Team`) }],
        creator: i18n._(msg`Budgie`),
        publisher: i18n._(msg`Budgie`),
        // eslint-disable-next-line lingui/no-unlocalized-strings
        robots: 'index, follow',
        alternates: {
            canonical: `https://budgie.app/${lang}`,
            languages: {
                en: 'https://budgie.app/en',
                uk: 'https://budgie.app/uk',
                fr: 'https://budgie.app/fr',
                de: 'https://budgie.app/de',
                es: 'https://budgie.app/es',
                'x-default': 'https://budgie.app/en'
            }
        },
        openGraph: {
            title: i18n._(msg`Budgie - Privacy-First Expense Tracker`),
            description: i18n._(
                msg`Track expenses, sync banks, manage crypto & stocks with complete privacy. Multi-currency support, debt tracking, and AI insights.`
            ),
            type: 'website',
            locale: lang
        },
        twitter: {
            card: 'summary_large_image',
            title: i18n._(msg`Budgie - Privacy-First Expense Tracker`),
            description: i18n._(
                msg`Track expenses, sync banks, manage crypto & stocks with complete privacy. Multi-currency support, debt tracking, and AI insights.`
            )
        }
    };
}

export default async function RootLayout({ params, children }: Props) {
    const { lang } = await params;

    initLingui(lang);

    return (
        <html lang={lang} suppressHydrationWarning>
            <body className={fixelDisplay.className}>
                <JsonLd data={organizationSchema} />
                <JsonLd data={createWebSiteSchema(lang)} />
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
