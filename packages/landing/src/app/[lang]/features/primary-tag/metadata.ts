import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'primary-tag',
    tier: FeatureTierEnum.NICHE,
    title: msg`Primary Tag — Label Transactions for Quick Scanning`,
    tagline: msg`One badge. Scan a long list at a glance.`,
    metaTitle: msg`Primary Tag — Quick-Scan Transaction Labeling — Budgie`,
    metaDescription: msg`Promote one tag per transaction to "primary" — it pins as a corner-star badge so you can scan #vacation or #shared at a glance without opening rows.`,
    primaryKeyword: 'label transactions quickly',
    seoKeywords: [
        'label transactions quickly',
        'primary tag finance app',
        'visual transaction tag',
        'corner star badge expense',
        'primary tag picker'
    ],
    relatedFeatureSlugs: ['transaction-tags', 'tag-analytics'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2026-04-24',
    updatedAt: '2026-05-03',
    ogTags: ['tags', 'ui', 'scanning']
} satisfies FeatureRegistryEntryInterface;
