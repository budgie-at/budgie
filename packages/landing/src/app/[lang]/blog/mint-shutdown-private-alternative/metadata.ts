import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'mint-shutdown-private-alternative',
    date: '2026-05-07',
    author: 'Budgie Team',
    image: '/images/design-mode/ai-budgeting-app-4x.jpg',
    readingTimeMinutes: 12,
    title: msg`After Mint: A Private, Offline Alternative That Actually Sticks Around`,
    description: msg`Mint shut down in 2024 and most replacements are still cloud-based. Here's why an offline-first, on-device tracker is the most durable answer for financial privacy.`,
    tags: ['mint-alternatives', 'offline-first', 'privacy', 'on-device', 'cloud-shutdown'],
    seoKeywords: ['Mint shutdown alternative', 'private Mint replacement', 'offline budget app after Mint', 'no cloud Mint alternative'],
    seoDescription: msg`Mint shut down in 2024. This guide covers why offline-first, on-device expense trackers are the only durable answer to vendor risk and financial-data privacy.`,
    relatedArticleSlugs: ['mint-alternatives-developers', 'offline-first-privacy-financial-app'],
    relatedFeatureSlugs: [
        'offline-first-expense-tracker',
        'csv-import',
        'monobank-sync',
        'database-backup',
        'private-budget-app-alternative'
    ]
};

/* eslint-enable lingui/no-unlocalized-strings */
