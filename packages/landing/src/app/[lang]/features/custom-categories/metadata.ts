import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'custom-categories',
    tier: FeatureTierEnum.CORE,
    title: msg`Custom Spending Categories That Bend To You`,
    tagline: msg`Create, merge, reassign, and reorder until the tree matches how you actually think about money.`,
    metaTitle: msg`Custom Spending Categories — Budgie`,
    metaDescription: msg`Build, merge, and reassign your own spending categories with mass-migration. Popularity-sorted selectors and MCC pre-fill keep the right category one tap away.`,
    primaryKeyword: 'custom budget categories',
    seoKeywords: [
        'custom budget categories',
        'custom expense categories',
        'merge categories app',
        'reassign transactions categories',
        'budget category tree'
    ],
    relatedFeatureSlugs: [
        'ai-auto-categorization',
        'expense-tracking',
        'uncategorized-transactions',
        'transaction-tags',
        'spending-analytics',
        'split-transactions'
    ],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2025-11-19',
    updatedAt: '2026-05-03',
    ogTags: ['categories', 'custom', 'organization']
} satisfies FeatureRegistryEntryInterface;
