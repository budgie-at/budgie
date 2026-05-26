import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../interface/article-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */

export const ARTICLE_REGISTRY: readonly ArticleRegistryEntryInterface[] = [
    {
        slug: 'budgie-offline-financial-data',
        date: '2025-02-10',
        author: 'Budgie Team',
        image: '/images/design-mode/ai-budgeting-app-4x.jpg',
        readingTimeMinutes: 15,
        title: msg`How Budgie Keeps Your Financial Data Off the Cloud`,
        description: msg`A technical deep-dive into Budgie's offline-first architecture, explaining how SQLite, AES-256 encryption, and device-to-device sync keep your financial data completely private.`,
        tags: ['privacy', 'security', 'architecture', 'encryption', 'open-source', 'offline-first'],
        seoKeywords: ['offline expense tracker', 'private finance app', 'local budget app', 'SQLite expense tracker'],
        seoDescription: msg`Discover exactly how Budgie keeps your financial data off the cloud. Learn about our SQLite architecture, AES-256 encryption, device-to-device sync, and open-source transparency.`,
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'pin-app-lock', 'database-backup', 'biometric-authentication']
    },
    {
        slug: 'cloud-budgeting-privacy-risks',
        date: '2025-01-27',
        author: 'Budgie Team',
        image: '/images/design-mode/ai-budgeting-app-4x.jpg',
        readingTimeMinutes: 16,
        title: msg`Why Cloud Budgeting Apps Are a Privacy Nightmare`,
        description: msg`A detailed technical analysis of how cloud-based budgeting apps collect, share, and expose your financial data through Plaid integrations, data breaches, and third-party aggregation.`,
        tags: ['privacy', 'security', 'cloud-security', 'data-breaches', 'plaid', 'financial-privacy', 'fintech'],
        seoKeywords: ['cloud budget app privacy', 'Plaid data risks', 'financial app data breaches'],
        seoDescription: msg`Technical analysis of privacy risks in cloud budgeting apps: Plaid data sharing, real data breaches, screen-scraping dangers, and how to evaluate financial app security.`,
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'monobank-sync', 'screenshot-protection']
    },
    {
        slug: 'local-first-movement-developers',
        date: '2025-01-29',
        author: 'Budgie Team',
        image: '/images/design-mode/ai-budgeting-app-4x.jpg',
        readingTimeMinutes: 18,
        title: msg`The Local-First Movement: Why Developers Are Building Offline Apps`,
        description: msg`Explore the local-first movement, CRDTs, sync engines, and why developers are choosing offline-first architecture for privacy-sensitive applications.`,
        tags: ['local-first', 'offline-first', 'CRDTs', 'sync-engines', 'software-architecture', 'privacy', 'developers'],
        seoKeywords: ['local-first software', 'CRDTs', 'offline-first architecture', 'sync engines'],
        seoDescription: msg`Explore the local-first movement: CRDTs, sync engines, real-world examples, and why developers are building offline-first apps for better privacy and performance.`,
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'database-backup', 'data-export']
    },
    {
        slug: 'mint-alternatives-developers',
        date: '2025-02-05',
        author: 'Budgie Team',
        image: '/images/design-mode/ai-budgeting-app-4x.jpg',
        readingTimeMinutes: 18,
        title: msg`Mint Shutdown: Where Developers Are Moving Their Finances`,
        description: msg`A comprehensive developer's guide to Mint alternatives after the shutdown. Detailed comparison of Budgie, Actual Budget, Firefly III, Lunch Money, YNAB, and more.`,
        tags: ['mint-alternatives', 'budget-apps', 'developer-tools', 'open-source', 'privacy', 'personal-finance'],
        seoKeywords: ['Mint alternatives', 'developer budget app', 'Mint shutdown replacement'],
        seoDescription: msg`Comprehensive developer's guide to Mint alternatives: detailed comparison of privacy-focused budget apps including Budgie, Actual Budget, Firefly III, and more.`,
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'csv-import', 'monobank-sync', 'multi-currency']
    },
    {
        slug: 'offline-first-privacy-financial-app',
        date: '2025-11-06',
        author: 'Budgie Team',
        image: '/images/design-mode/ai-budgeting-app-4x.jpg',
        readingTimeMinutes: 5,
        title: msg`Why Offline-First is the Only Way for Your Financial Privacy`,
        description: msg`Discover why offline-first architecture is the only truly private approach for financial apps. Learn about data risks, privacy by design, and how Budgie keeps your finances secure.`,
        tags: ['privacy', 'security', 'offline-first', 'financial-privacy', 'data-protection'],
        seoKeywords: ['offline-first privacy', 'financial app security', 'private budget app'],
        seoDescription: msg`Learn why offline-first architecture is the only way to guarantee financial privacy. Discover the hidden dangers of cloud apps and how Budgie protects your data.`,
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'pin-app-lock', 'screenshot-protection']
    },
    {
        slug: 'open-source-budgeting-transparency',
        date: '2025-02-12',
        author: 'Budgie Team',
        image: '/images/design-mode/ai-budgeting-app-4x.jpg',
        readingTimeMinutes: 15,
        title: msg`Source-Available Budgeting: Why Transparency Matters for Your Money`,
        description: msg`Learn why public source matters for financial software, how to audit apps yourself, and how Budgie's transparent development protects your financial data.`,
        tags: ['source-available', 'transparency', 'security', 'privacy', 'community'],
        seoKeywords: ['source available budget app', 'transparent finance app', 'public source security'],
        seoDescription: msg`Learn why public source matters for financial software. How to audit apps yourself and how Budgie's transparent development protects your data.`,
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'data-export', 'database-backup']
    },
    {
        slug: 'ynab-alternatives-privacy',
        date: '2025-02-03',
        author: 'Budgie Team',
        image: '/images/design-mode/ai-budgeting-app-4x.jpg',
        readingTimeMinutes: 17,
        title: msg`Best YNAB Alternatives for Privacy-Conscious Users`,
        description: msg`Comprehensive comparison of privacy-focused YNAB alternatives. Detailed reviews of Budgie, Actual Budget, Firefly III, and more with migration guide.`,
        tags: ['ynab', 'alternatives', 'privacy', 'comparison', 'budgeting', 'offline-first', 'open-source'],
        seoKeywords: ['YNAB alternatives', 'privacy budget app', 'YNAB replacement'],
        seoDescription: msg`Best YNAB alternatives for privacy-conscious users. Detailed comparison of offline-first, open-source budget apps with YNAB migration guide.`,
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'custom-categories', 'transaction-tags', 'recurring-payments-calendar']
    },
    {
        slug: 'mint-shutdown-private-alternative',
        date: '2026-05-07',
        author: 'Budgie Team',
        image: '/images/design-mode/ai-budgeting-app-4x.jpg',
        readingTimeMinutes: 12,
        title: msg`After Mint: A Private, Offline Alternative That Actually Sticks Around`,
        description: msg`Mint shut down in 2024 and most replacements are still cloud-based. Here's why an offline-first, on-device tracker is the most durable answer for financial privacy.`,
        tags: ['mint-alternatives', 'offline-first', 'privacy', 'on-device', 'cloud-shutdown'],
        seoKeywords: [
            'Mint shutdown alternative',
            'private Mint replacement',
            'offline budget app after Mint',
            'no cloud Mint alternative'
        ],
        seoDescription: msg`Mint shut down in 2024. This guide covers why offline-first, on-device expense trackers are the only durable answer to vendor risk and financial-data privacy.`,
        relatedFeatureSlugs: [
            'offline-first-expense-tracker',
            'csv-import',
            'monobank-sync',
            'database-backup',
            'private-budget-app-alternative'
        ]
    },
    {
        slug: 'on-device-ai-budget-app-explainer',
        date: '2026-05-07',
        author: 'Budgie Team',
        image: '/images/design-mode/ai-budgeting-app-4x.jpg',
        readingTimeMinutes: 11,
        title: msg`On-Device AI in Your Budget App: How It Works and Why It Matters`,
        description: msg`Cloud AI assistants process your spending data on remote servers. On-device AI keeps every inference local. Here's how a 1.7B-param model, offline embeddings, and Whisper speech recognition work together in Budgie.`,
        tags: ['on-device-ai', 'privacy', 'local-llm', 'voice-input', 'ai-categorization'],
        seoKeywords: ['on-device AI budget app', 'private AI finance', 'local LLM finance app', 'offline AI expense tracker'],
        seoDescription: msg`Learn how on-device AI keeps your spending data private. Covers local LLM inference, offline embeddings, and Whisper speech-to-text — no cloud required.`,
        relatedFeatureSlugs: ['ai-auto-categorization', 'voice-transaction-entry', 'ai-transaction-suggestions', 'on-device-ai-budget-app']
    },
    {
        slug: 'offline-first-bank-data-safety',
        date: '2026-05-07',
        author: 'Budgie Team',
        image: '/images/design-mode/ai-budgeting-app-4x.jpg',
        readingTimeMinutes: 10,
        title: msg`Bank Data Safety: Why Offline-First Is the Only Honest Answer`,
        description: msg`Financial aggregators centralise millions of bank credentials in one place — a magnet for attackers. Offline-first architecture eliminates the target. Here's how Budgie connects to banks without handing your credentials to a third party.`,
        tags: ['bank-data-safety', 'offline-first', 'privacy', 'plaid', 'aggregators', 'security'],
        seoKeywords: ['offline-first finance', 'bank data safety', 'Plaid alternative', 'no bank login budget app'],
        seoDescription: msg`Financial aggregators are high-value breach targets. Discover how offline-first architecture, direct bank APIs, and CSV/PDF imports keep your bank data safe without Plaid.`,
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'monobank-sync', 'no-bank-login-budget-app']
    },
    {
        slug: 'historical-exchange-rates-budget-analytics',
        date: '2026-05-26',
        author: 'Budgie Team',
        image: '/images/design-mode/ai-budgeting-app-4x.jpg',
        readingTimeMinutes: 9,
        title: msg`Historical Exchange Rates in Budget Analytics`,
        description: msg`Why a multi-currency expense tracker needs transaction-date valuation, not today's exchange rate, and how Budgie keeps imported history comparable in your base currency.`,
        tags: ['multi-currency', 'exchange-rates', 'analytics', 'csv-import', 'bank-sync'],
        seoKeywords: [
            'historical exchange rates budget app',
            'multi currency expense tracker analytics',
            'transaction date exchange rate',
            'CSV import currency conversion'
        ],
        seoDescription: msg`Learn why budget analytics should value each transaction using the exchange rate from its real transaction date. Budgie stores base-currency values for accurate multi-currency history.`,
        relatedFeatureSlugs: ['multi-currency', 'spending-analytics', 'csv-import', 'monobank-sync']
    }
];
/* eslint-enable lingui/no-unlocalized-strings */
