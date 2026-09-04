import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'offline-first-privacy-financial-app',
    date: '2025-11-06',
    author: 'Budgie Team',
    readingTimeMinutes: 5,
    title: msg`Why Offline-First is the Only Way for Your Financial Privacy`,
    description: msg`Discover why offline-first architecture is the only truly private approach for financial apps. Learn about data risks, privacy by design, and how Budgie keeps your finances secure.`,
    tags: ['privacy', 'security', 'offline-first', 'financial-privacy', 'data-protection'],
    seoKeywords: ['offline-first privacy', 'financial app security', 'private budget app'],
    seoDescription: msg`Learn why offline-first architecture is the only way to guarantee financial privacy. Discover the hidden dangers of cloud apps and how Budgie protects your data.`,
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'local-first-movement-developers'],
    relatedFeatureSlugs: ['offline-first-expense-tracker', 'pin-app-lock', 'screenshot-protection']
};

/* oxlint-enable lingui/no-unlocalized-strings */
