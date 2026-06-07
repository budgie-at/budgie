import { msg } from '@lingui/core/macro';

import { FeatureCategoryEnum } from '../../../../feature/constant/feature-category.enum';
import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'private-budget-app-alternative',
    tier: FeatureTierEnum.HERO,
    category: FeatureCategoryEnum.COMPARISON,
    title: msg`Private Budget App — A Cloud-Free Alternative`,
    tagline: msg`Cloud-based personal finance apps mirror every transaction to their servers. Budgie keeps your ledger on your device. No account, no aggregator, no exposure.`,
    metaTitle: msg`Private Budget App — Cloud-Free Alternative — Budgie`,
    metaDescription: msg`Tired of cloud-based PFM apps holding your transactions? Budgie is offline-first, no account, no aggregator. Your financial data stays on your phone.`,
    primaryKeyword: 'private alternative cloud budget app',
    seoKeywords: [
        'private budget app',
        'cloud budget app alternative',
        'no cloud expense tracker',
        'private personal finance app',
        'no aggregator budget app'
    ],
    relatedFeatureSlugs: ['offline-first-expense-tracker', 'monobank-sync', 'database-backup', 'pin-app-lock'],
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'budgie-offline-financial-data', 'mint-shutdown-private-alternative'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07',
    ogTags: ['privacy', 'comparison', 'alternative']
} satisfies FeatureRegistryEntryInterface;
