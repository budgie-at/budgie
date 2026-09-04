import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'budgie-offline-financial-data',
    date: '2025-02-10',
    author: 'Budgie Team',
    readingTimeMinutes: 15,
    title: msg`How Budgie Keeps Your Financial Data Off the Cloud`,
    description: msg`A technical deep-dive into Budgie's offline-first architecture, explaining how SQLite, AES-256 encryption, and device-to-device sync keep your financial data completely private.`,
    tags: ['privacy', 'security', 'architecture', 'encryption', 'open-source', 'offline-first'],
    seoKeywords: ['offline expense tracker', 'private finance app', 'local budget app', 'SQLite expense tracker'],
    seoDescription: msg`Discover exactly how Budgie keeps your financial data off the cloud. Learn about our SQLite architecture, AES-256 encryption, device-to-device sync, and open-source transparency.`,
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'open-source-budgeting-transparency'],
    relatedFeatureSlugs: ['offline-first-expense-tracker', 'pin-app-lock', 'database-backup', 'biometric-authentication']
};

/* oxlint-enable lingui/no-unlocalized-strings */
