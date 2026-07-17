import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'convert-to-refund',
    tier: FeatureTierEnum.NICHE,
    title: msg`Convert Income to Refund`,
    tagline: msg`Link refund income back to the expense it reverses — full or partial, automatic or manual, always reversible.`,
    metaTitle: msg`Convert Income to Refund in Expense App — Budgie`,
    metaDescription: msg`Budgie links refund income back to the original expense, supports partial refunds, searches same-currency expenses across accounts, and keeps analytics clean.`,
    primaryKeyword: 'convert income to refund',
    seoKeywords: [
        'convert income to refund',
        'refund handling expense tracker',
        'partial refund tracker',
        'fix miscategorized income',
        'refund matching expense app'
    ],
    relatedFeatureSlugs: ['transfer-pair-detection', 'expense-tracking', 'transaction-long-press-menu', 'spending-analytics'],
    relatedArticleSlugs: ['budgie-offline-financial-data'],
    publishedAt: '2026-05-25',
    updatedAt: '2026-05-25',
    ogTags: ['refunds', 'analytics', 'cleanup']
} satisfies FeatureRegistryEntryInterface;
