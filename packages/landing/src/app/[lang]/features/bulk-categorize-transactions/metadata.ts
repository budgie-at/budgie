import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'bulk-categorize-transactions',
    tier: FeatureTierEnum.CORE,
    title: msg`Bulk Categorize and Tag Transactions`,
    tagline: msg`Uncategorized or untagged bank transactions grouped by merchant, with suggestions learned from your own choices. One tap per group.`,
    metaTitle: msg`Bulk Categorize and Tag Transactions — Budgie`,
    metaDescription: msg`Categorize and tag bank transactions in bulk. Budgie groups them by merchant, suggests from your own history and accepts the confident ones in one tap.`,
    primaryKeyword: 'bulk categorize transactions',
    seoKeywords: [
        'bulk categorize transactions',
        'categorize bank transactions',
        'categorize multiple transactions at once',
        'batch categorize expenses',
        'categorize imported transactions',
        'categorize expenses app',
        'bulk tag transactions',
        'tag multiple transactions at once'
    ],
    relatedFeatureSlugs: [
        'uncategorized-transactions',
        'categorization-rules',
        'tag-analytics',
        'transaction-tags',
        'mcc-auto-category',
        'ai-auto-categorization'
    ],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'ynab-alternatives-privacy'],
    publishedAt: '2026-09-25',
    updatedAt: '2026-09-27',
    ogTags: ['categorize', 'tags', 'bulk']
} satisfies FeatureRegistryEntryInterface;
