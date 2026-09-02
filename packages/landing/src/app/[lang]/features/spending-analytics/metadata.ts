import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'spending-analytics',
    tier: FeatureTierEnum.CORE,
    title: msg`Spending Analytics That Actually Help`,
    tagline: msg`Category breakdown, tag breakdown, monthly trends — drill into any chart slice.`,
    metaTitle: msg`Spending Analytics & Charts — Budgie`,
    metaDescription: msg`Category and tag breakdown charts, monthly trends, and balance timelines — with drill-down from any chart slice to the underlying transactions. Analytics that find your gaps.`,
    primaryKeyword: 'spending tracker with charts',
    seoKeywords: [
        'spending tracker with charts',
        'expense analytics app',
        'category breakdown chart',
        'tag analytics',
        'mobile finance dashboard'
    ],
    relatedFeatureSlugs: [
        'budget-planning',
        'tag-analytics',
        'custom-categories',
        'uncategorized-transactions',
        'date-filter-presets',
        'recurring-payments-calendar',
        'ai-merchant-translation',
        'bank-fee-tracking'
    ],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2025-12-19',
    updatedAt: '2026-05-03',
    ogTags: ['analytics', 'charts', 'drill-down']
} satisfies FeatureRegistryEntryInterface;
