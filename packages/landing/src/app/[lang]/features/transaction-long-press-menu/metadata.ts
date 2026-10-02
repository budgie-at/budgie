import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'transaction-long-press-menu',
    tier: FeatureTierEnum.CORE,
    title: msg`Long-Press Quick Actions on Every Transaction`,
    tagline: msg`Long-press any transaction card to edit, convert to refund or transfer, attach a debt, delete, or revert — no full edit form required.`,
    metaTitle: msg`Quick Edit Transaction App — Long-Press Menu — Budgie`,
    metaDescription: msg`Long-press any transaction in Budgie for a popover menu: edit, convert to refund, convert to transfer, attach a debt, delete, or revert. Two taps where the rest of the market needs five.`,
    primaryKeyword: 'quick edit transaction app',
    seoKeywords: [
        'quick edit transaction app',
        'long-press transaction menu',
        'context menu expense tracker',
        'transaction quick actions',
        'gesture-driven budget app',
        'convert expense to transfer',
        'convert income to refund',
        'partial refund tracker',
        'reclassify transaction app'
    ],
    relatedFeatureSlugs: [
        'expense-tracking',
        'account-transfers',
        'transfer-pair-detection',
        'split-transactions',
        'transaction-tags',
        'ai-transaction-suggestions'
    ],
    relatedArticleSlugs: ['budgie-offline-financial-data'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-09-26',
    ogTags: ['ux', 'gestures', 'productivity']
} satisfies FeatureRegistryEntryInterface;
