import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'convert-to-transfer',
    tier: FeatureTierEnum.POWER,
    title: msg`Convert a Transaction to a Transfer`,
    tagline: msg`Reclassify, don't re-enter — turn an expense into a transfer in one tap.`,
    metaTitle: msg`Convert Expense to Transfer Between Accounts — Budgie`,
    metaDescription: msg`Logged a payment as expense but it was a transfer? One tap reclassifies — both legs link, balances reconcile, analytics updates.`,
    primaryKeyword: 'convert expense to transfer',
    seoKeywords: [
        'convert expense to transfer',
        'reclassify transaction app',
        'transaction-to-transfer converter',
        'transfer reclassification',
        'expense to transfer'
    ],
    relatedFeatureSlugs: ['account-transfers', 'transfer-pair-detection'],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'mint-alternatives-developers'],
    publishedAt: '2026-01-05',
    updatedAt: '2026-05-03',
    ogTags: ['transfer', 'convert', 'reclassify']
} satisfies FeatureRegistryEntryInterface;
