import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'uncategorized-transactions',
    tier: FeatureTierEnum.CORE,
    title: msg`Uncategorized Transaction Finder`,
    tagline: msg`A filter-aware missing-category pill surfaces uncategorized transactions before they distort your budget analytics.`,
    metaTitle: msg`Uncategorized Transactions Finder`,
    metaDescription: msg`Budgie finds uncategorized transactions under your active filters. Tap the missing-category pill to clean category gaps fast, offline, and on-device.`,
    primaryKeyword: 'uncategorized transactions',
    seoKeywords: [
        'uncategorized transactions',
        'missing category transactions',
        'categorize expenses app',
        'expense category cleanup',
        'budget analytics cleanup'
    ],
    relatedFeatureSlugs: ['custom-categories', 'spending-analytics', 'ai-auto-categorization', 'date-filter-presets', 'mcc-auto-category'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
    publishedAt: '2026-05-18',
    updatedAt: '2026-05-18',
    ogTags: ['uncategorized', 'categories', 'analytics']
} satisfies FeatureRegistryEntryInterface;
