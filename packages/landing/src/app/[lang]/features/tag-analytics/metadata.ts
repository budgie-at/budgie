import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'tag-analytics',
    tier: FeatureTierEnum.POWER,
    title: msg`Tag-Based Spending Analytics`,
    tagline: msg`A Tags tab in Analytics with income and spending totalled tag by tag, each with its share of the period, plus an Untagged row for every gap in your labeling.`,
    metaTitle: msg`Spending Analytics by Tag — Drillable Reports — Budgie`,
    metaDescription: msg`See income and spending per tag in a dedicated Analytics tab, each with its share of the period. The Untagged row finds every transaction missing a label.`,
    primaryKeyword: 'spending by tag analytics',
    seoKeywords: [
        'spending by tag analytics',
        'tag-based budget app',
        'project expense analytics',
        'shared expense analytics',
        'reimbursable expense tracker',
        'analytics by tag mobile',
        'untagged transactions report'
    ],
    relatedFeatureSlugs: ['transaction-tags', 'primary-tag', 'spending-analytics', 'date-filter-presets', 'ai-tag-suggestions'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers', 'budgie-offline-financial-data'],
    publishedAt: '2026-01-04',
    updatedAt: '2026-09-26',
    ogTags: ['tags', 'analytics', 'drill-down']
} satisfies FeatureRegistryEntryInterface;
