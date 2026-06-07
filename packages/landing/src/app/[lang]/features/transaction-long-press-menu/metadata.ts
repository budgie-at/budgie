import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'transaction-long-press-menu',
    tier: FeatureTierEnum.CORE,
    title: msg`Long-Press Quick Actions on Every Transaction`,
    tagline: msg`Long-press any transaction card to edit, delete, split, convert to transfer, or convert income to a refund — no full edit form required.`,
    metaTitle: msg`Quick Edit Transaction App — Long-Press Menu — Budgie`,
    metaDescription: msg`Long-press any transaction in Budgie for a native context menu: edit, delete, split, convert to transfer, or convert income to refund. Two taps where the rest of the market needs five.`,
    primaryKeyword: 'quick edit transaction app',
    seoKeywords: [
        'quick edit transaction app',
        'long-press transaction menu',
        'context menu expense tracker',
        'transaction quick actions',
        'gesture-driven budget app'
    ],
    relatedFeatureSlugs: [
        'expense-tracking',
        'convert-to-transfer',
        'convert-to-refund',
        'split-transactions',
        'transaction-tags',
        'ai-transaction-suggestions'
    ],
    relatedArticleSlugs: ['budgie-offline-financial-data'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07',
    ogTags: ['ux', 'gestures', 'productivity']
} satisfies FeatureRegistryEntryInterface;
