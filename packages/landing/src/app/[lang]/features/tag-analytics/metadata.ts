import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'tag-analytics',
    tier: FeatureTierEnum.POWER,
    title: msg`Tag-Based Spending Analytics`,
    tagline: msg`A dedicated Tags tab in analytics with per-tag totals and a drillable Untagged bucket that surfaces every gap in your labeling.`,
    metaTitle: msg`Spending Analytics by Tag — Drillable Reports — Budgie`,
    metaDescription: msg`See income, expense, and net per tag in a dedicated analytics tab. The Untagged bucket finds every transaction missing a label so nothing falls through.`,
    primaryKeyword: 'spending by tag analytics',
    seoKeywords: [
        'spending by tag analytics',
        'tag-based budget app',
        'project expense analytics',
        'shared expense analytics',
        'reimbursable expense tracker'
    ],
    relatedFeatureSlugs: ['transaction-tags', 'primary-tag', 'spending-analytics', 'date-filter-presets'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2026-01-04',
    updatedAt: '2026-05-07',
    ogTags: ['tags', 'analytics', 'drill-down']
} satisfies FeatureRegistryEntryInterface;
