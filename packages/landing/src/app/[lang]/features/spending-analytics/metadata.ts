import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'spending-analytics',
    tier: FeatureTierEnum.CORE,
    pillar: PillarEnum.PLANNING,
    name: msg`Spending Analytics`,
    tagline: msg`Category and tag breakdowns for any period. Drill into any row.`,
    metaTitle: msg`Spending Analytics & Charts — Budgie`,
    metaDescription: msg`Category and tag breakdowns for any period, with drill-down from any row to its transactions. Analytics that find your gaps.`,
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
        'ai-category-translation',
        'bank-fee-tracking'
    ],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-shutdown-private-alternative'],
    publishedAt: '2025-12-19',
    updatedAt: '2026-09-16',
    ogTags: ['analytics', 'charts', 'drill-down']
} satisfies FeatureRegistryEntryInterface;
