import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'split-transactions',
    tier: FeatureTierEnum.POWER,
    pillar: PillarEnum.PLANNING,
    name: msg`Split Transactions`,
    tagline: msg`That €87 supermarket bill was groceries and a phone charger. Split it.`,
    metaTitle: msg`Split Transactions — Budgie`,
    metaDescription: msg`Divide a single transaction across multiple categories with a running left-to-assign total. Each split keeps its own tags and comment.`,
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
    updatedAt: '2026-09-16',
    ogTags: ['split', 'categories', 'transactions']
} satisfies FeatureRegistryEntryInterface;
