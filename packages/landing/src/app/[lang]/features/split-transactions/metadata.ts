import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'split-transactions',
    tier: FeatureTierEnum.POWER,
    title: msg`Split a Transaction Across Categories`,
    tagline: msg`That €87 supermarket bill was groceries and a phone charger — split it.`,
    metaTitle: msg`Split Transactions — Budgie`,
    metaDescription: msg`Divide a single transaction across multiple categories with a remaining-budget indicator. Each split keeps its own tags and comment.`,
    primaryKeyword: 'split transaction by category',
    seoKeywords: [
        'split transaction by category',
        'split expense app',
        'multi-category transaction',
        'receipt split tracker',
        'split bill app'
    ],
    relatedFeatureSlugs: ['expense-tracking', 'custom-categories', 'transaction-tags'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2026-02-01',
    updatedAt: '2026-05-03',
    ogTags: ['split', 'categories', 'transactions']
} satisfies FeatureRegistryEntryInterface;
