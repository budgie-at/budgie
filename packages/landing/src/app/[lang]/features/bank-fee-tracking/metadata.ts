import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'bank-fee-tracking',
    tier: FeatureTierEnum.POWER,
    title: msg`Bank Fee Tracking`,
    tagline: msg`Keep ATM fees, transfer fees, and card commissions visible without polluting transfers.`,
    metaTitle: msg`Bank Fee Tracking — Budgie`,
    metaDescription: msg`Track bank fees as first-class transaction entries. ATM fees, transfer fees, and card commissions stay visible in analytics even when the main movement is a transfer.`,
    primaryKeyword: 'bank fee tracker',
    seoKeywords: ['bank fee tracker', 'ATM fee tracker', 'transfer fee analytics', 'card commission tracker', 'expense tracker bank fees'],
    relatedFeatureSlugs: ['spending-analytics', 'monobank-sync', 'transfer-pair-detection', 'split-transactions'],
    relatedArticleSlugs: ['historical-exchange-rates-budget-analytics', 'budgie-offline-financial-data'],
    publishedAt: '2026-06-04',
    updatedAt: '2026-06-04',
    ogTags: ['fees', 'analytics', 'bank-sync']
} satisfies FeatureRegistryEntryInterface;
