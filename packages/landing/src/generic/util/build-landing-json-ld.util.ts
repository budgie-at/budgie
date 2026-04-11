/* eslint-disable lingui/no-unlocalized-strings */
import { msg } from '@lingui/core/macro';

import { BASE_URL } from '../constant/seo.constant';

import type { I18n } from '@lingui/core';

export const buildLandingJsonLd = (i18n: I18n): { softwareApplication: Record<string, unknown>; faqPage: Record<string, unknown> } => {
    const faqItems = [
        {
            question: i18n._(msg`How is my financial data kept private?`),
            answer: i18n._(
                msg`Your data never leaves your device unless you explicitly sync with your own cloud storage. We don't have servers storing your financial information, and we can't see your transactions. Everything is encrypted locally on your device.`
            )
        },
        {
            question: i18n._(msg`Does bank sync work offline?`),
            answer: i18n._(
                msg`Bank sync requires an internet connection to fetch new transactions, but once synced, you can view and categorize everything offline. The app works completely offline for manual expense entry and viewing your data.`
            )
        },
        {
            question: i18n._(msg`What cryptocurrencies and assets can I track?`),
            answer: i18n._(
                msg`Budgie supports tracking for major cryptocurrencies, stocks, ETFs, and traditional bank accounts. You can manually add any asset or connect supported exchanges and brokerages for automatic tracking.`
            )
        },
        {
            question: i18n._(msg`Can I use Budgie across multiple devices?`),
            answer: i18n._(
                msg`Yes! You can sync your data across devices using your own cloud storage (iCloud, Google Drive, Dropbox). Your data remains encrypted and private—we never see it during the sync process.`
            )
        },
        {
            question: i18n._(msg`How does the open source license work?`),
            answer: i18n._(
                msg`Budgie uses a source-available license that allows you to view, modify, and contribute to the code while ensuring only we can monetize the official app. This keeps the project sustainable while maintaining transparency.`
            )
        }
    ];

    const softwareApplication = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Budgie',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'iOS, Android',
        description: i18n._(msg`Privacy-first expense tracker that keeps your financial data on your device.`),
        url: BASE_URL,
        image: `${BASE_URL}/images/design-mode/ai-budgeting-app-4x.jpg`,
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
        }
    };

    const faqPage = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer
            }
        }))
    };

    return { softwareApplication, faqPage };
};
