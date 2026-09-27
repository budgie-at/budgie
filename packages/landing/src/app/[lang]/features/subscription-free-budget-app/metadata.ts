import { msg } from '@lingui/core/macro';

import { FeatureCategoryEnum } from '../../../../feature/constant/feature-category.enum';
import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'subscription-free-budget-app',
    tier: FeatureTierEnum.HERO,
    category: FeatureCategoryEnum.COMPARISON,
    title: msg`Subscription-Free Budget App — Completely Free`,
    tagline: msg`Recurring monthly fees turn budgeting into another bill. Budgie is completely free — every feature, no unlock, no tier.`,
    metaTitle: msg`Budget App No Subscription — 100% Free — Budgie`,
    metaDescription: msg`Stop paying monthly to track your money. Budgie is completely free, with no unlock and no paid tier. Offline-first and private.`,
    primaryKeyword: 'budget app no subscription',
    seoKeywords: [
        'budget app no subscription',
        'free budget app no subscription',
        'no monthly fee expense tracker',
        'completely free budgeting app',
        'no subscription personal finance'
    ],
    relatedFeatureSlugs: ['expense-tracking', 'monobank-sync', 'spending-analytics', 'self-hosted-finance-app-mobile'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07',
    ogTags: ['pricing', 'comparison', 'subscription-free']
} satisfies FeatureRegistryEntryInterface;
