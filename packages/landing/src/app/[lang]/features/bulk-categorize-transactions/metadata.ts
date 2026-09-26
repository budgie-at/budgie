import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'bulk-categorize-transactions',
    tier: FeatureTierEnum.CORE,
    title: msg`Bulk Transaction Categorization`,
    tagline: msg`Uncategorized bank transactions grouped by merchant, with suggestions learned from your own choices. One tap per group.`,
    metaTitle: msg`Bulk Categorize Bank Transactions in One Tap`,
    metaDescription: msg`Categorize bank transactions in bulk. Budgie groups uncategorized rows by merchant, suggests categories from your own history and applies them in one tap.`,
    primaryKeyword: 'bulk categorize transactions',
    seoKeywords: [
        'bulk categorize transactions',
        'categorize bank transactions',
        'categorize multiple transactions at once',
        'batch categorize expenses',
        'categorize imported transactions'
    ],
    relatedFeatureSlugs: [
        'uncategorized-transactions',
        'categorization-rules',
        'transaction-long-press-menu',
        'mcc-auto-category',
        'ai-auto-categorization',
        'custom-categories'
    ],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'ynab-alternatives-privacy'],
    publishedAt: '2026-09-25',
    updatedAt: '2026-09-25',
    ogTags: ['categorize', 'bulk', 'merchants']
} satisfies FeatureRegistryEntryInterface;
