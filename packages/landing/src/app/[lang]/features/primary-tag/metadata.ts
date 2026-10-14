import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'primary-tag',
    tier: FeatureTierEnum.NICHE,
    name: msg`Primary Tag`,
    tagline: msg`One tag per row. Scan a long list at a glance.`,
    metaTitle: msg`Primary Tag — Quick-Scan Transaction Labeling — Budgie`,
    metaDescription: msg`The first tag on a transaction is its primary tag, shown on the list. Long-press another tag in the picker to change it.`,
    primaryKeyword: 'label transactions quickly',
    seoKeywords: [
        'label transactions quickly',
        'primary tag finance app',
        'visual transaction tag',
        'main tag per transaction',
        'primary tag picker'
    ],
    relatedFeatureSlugs: ['transaction-tags', 'tag-analytics'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2026-04-24',
    updatedAt: '2026-05-03',
    ogTags: ['tags', 'ui', 'scanning']
} satisfies FeatureRegistryEntryInterface;
