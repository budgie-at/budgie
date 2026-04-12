import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

/* eslint-disable lingui/no-unlocalized-strings */
export interface ArticleRegistryEntryInterface {
    readonly slug: string;
    readonly date: string;
    readonly author: string;
    readonly image: string;
    readonly readingTimeMinutes: number;
    readonly title: MessageDescriptor;
    readonly description: MessageDescriptor;
    readonly tags: readonly string[];
    readonly seoKeywords: readonly string[];
    readonly seoDescription: MessageDescriptor;
}

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
        seoDescription: msg`Discover exactly how Budgie keeps your financial data off the cloud. Learn about our SQLite architecture, AES-256 encryption, device-to-device sync, and open-source transparency.`
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
        seoDescription: msg`Technical analysis of privacy risks in cloud budgeting apps: Plaid data sharing, real data breaches, screen-scraping dangers, and how to evaluate financial app security.`
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
        seoDescription: msg`Explore the local-first movement: CRDTs, sync engines, real-world examples, and why developers are building offline-first apps for better privacy and performance.`
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
        seoDescription: msg`Comprehensive developer's guide to Mint alternatives: detailed comparison of privacy-focused budget apps including Budgie, Actual Budget, Firefly III, and more.`
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
        seoDescription: msg`Learn why offline-first architecture is the only way to guarantee financial privacy. Discover the hidden dangers of cloud apps and how Budgie protects your data.`
    },
    {
        slug: 'open-source-budgeting-transparency',
        date: '2025-02-12',
        author: 'Budgie Team',
        image: '/images/design-mode/ai-budgeting-app-4x.jpg',
        readingTimeMinutes: 15,
        title: msg`Open-Source Budgeting: Why Transparency Matters for Your Money`,
        description: msg`Learn why open-source matters for financial software, how to audit apps yourself, and how Budgie's transparent development protects your financial data.`,
        tags: ['open-source', 'transparency', 'security', 'privacy', 'community'],
        seoKeywords: ['open source budget app', 'transparent finance app', 'open source security'],
        seoDescription: msg`Learn why open-source matters for financial software. How to audit apps yourself and how Budgie's transparent development protects your data.`
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
        seoDescription: msg`Best YNAB alternatives for privacy-conscious users. Detailed comparison of offline-first, open-source budget apps with YNAB migration guide.`
    }
];
/* eslint-enable lingui/no-unlocalized-strings */
