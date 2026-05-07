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
                msg`Budgie supports manual tracking of Bitcoin, Ethereum, other crypto, stocks, ETFs, and traditional bank accounts. Import positions and transactions via CSV. There are no automatic exchange or brokerage API integrations — your data stays on-device.`
            )
        },
        {
            question: i18n._(msg`Can I use Budgie across multiple devices?`),
            answer: i18n._(
                msg`Yes — export your encrypted database as a single file, save it to any storage you control (iCloud, Google Drive, Dropbox, anywhere), and import it on another device. The file stays encrypted with your PIN; we never see it because we have no servers.`
            )
        },
        {
            question: i18n._(msg`How does the source-available license work?`),
            answer: i18n._(
                msg`Budgie uses a custom source-available license that lets you read, fork, and contribute to the code, while reserving commercial distribution to the project. The full source is on GitHub — you can audit every line.`
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
