import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'statistics-tags-tab',
    tier: FeatureTierEnum.POWER,
    title: msg`Tags Tab in Statistics — Per-Tag Income, Expense, and Net`,
    tagline: msg`A dedicated Tags tab in Statistics with sortable per-tag totals and a drillable Untagged bucket that surfaces every transaction missing a label.`,
    metaTitle: msg`Analytics by Tag — Per-Tag Spending Tab — Budgie`,
    metaDescription: msg`Budgie's Statistics screen has a dedicated Tags tab with income, expense, and net per tag plus a drillable Untagged bucket for finding labeling gaps.`,
    primaryKeyword: 'analytics by tag mobile',
    seoKeywords: [
        'analytics by tag mobile',
        'tag analytics expense tracker',
        'per-tag spending report',
        'untagged transactions report',
        'tag-based budgeting analytics'
    ],
    relatedFeatureSlugs: ['tag-analytics', 'spending-analytics', 'transaction-tags', 'ai-tag-suggestions', 'primary-tag'],
    relatedArticleSlugs: ['budgie-offline-financial-data'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07',
    ogTags: ['analytics', 'tags', 'statistics']
} satisfies FeatureRegistryEntryInterface;
