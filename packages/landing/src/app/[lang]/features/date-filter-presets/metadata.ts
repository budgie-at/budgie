import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'date-filter-presets',
    tier: FeatureTierEnum.CORE,
    title: msg`Date Filter Presets — Past Periods, One Tap`,
    tagline: msg`Eight presets, locale-aware week start, custom range fallback.`,
    metaTitle: msg`Date Filter Presets — Budgie`,
    metaDescription: msg`Today, Yesterday, This Week, Last Week, This Month, Last Month, This Year, All Time — every screen with a list, two taps to the right window. Locale-aware.`,
    primaryKeyword: 'filter transactions by date',
    seoKeywords: [
        'filter transactions by date',
        'date range expense tracker',
        'budget app date filter',
        'monthly view expense app',
        'date preset filter'
    ],
    relatedFeatureSlugs: [
        'spending-analytics',
        'uncategorized-transactions',
        'recurring-payments-calendar',
        'tag-analytics',
        'mcc-auto-category'
    ],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2026-05-02',
    updatedAt: '2026-05-03',
    ogTags: ['filters', 'dates', 'presets']
} satisfies FeatureRegistryEntryInterface;
