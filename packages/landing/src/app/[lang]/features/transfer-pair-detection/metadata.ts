import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'transfer-pair-detection',
    tier: FeatureTierEnum.POWER,
    title: msg`Smart Transfer and Refund Consolidation`,
    tagline: msg`Budgie consolidates obvious transfers and merchant refunds automatically, then leaves ambiguous matches for review.`,
    metaTitle: msg`Smart Transfer and Refund Consolidation — Budgie`,
    metaDescription: msg`Budgie merges obvious transfer pairs and merchant refunds so bank imports do not inflate spending or income. Counter-IBAN, amount, date, and title matching run on-device.`,
    primaryKeyword: 'duplicate transaction merger',
    seoKeywords: [
        'duplicate transaction merger',
        'transfer pair detection',
        'auto-merge transfers',
        'automatic refund matching',
        'IBAN match transfer',
        'cross-currency transfer detection'
    ],
    relatedFeatureSlugs: ['account-transfers', 'convert-to-refund', 'bank-resync-window', 'convert-to-transfer'],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'mint-alternatives-developers'],
    publishedAt: '2026-05-01',
    updatedAt: '2026-05-07',
    ogTags: ['transfers', 'deduplication', 'smart']
} satisfies FeatureRegistryEntryInterface;
