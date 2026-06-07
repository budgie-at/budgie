import { msg } from '@lingui/core/macro';

import { FeatureCategoryEnum } from '../../../../feature/constant/feature-category.enum';
import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'subscription-free-budget-app',
    tier: FeatureTierEnum.HERO,
    category: FeatureCategoryEnum.COMPARISON,
    title: msg`Subscription-Free Budget App — Pay Once or Free`,
    tagline: msg`Recurring monthly fees turn budgeting into another bill. Budgie's core is free; advanced features unlock with a one-time purchase you actually own.`,
    metaTitle: msg`Budget App No Subscription — Free Core, One-Time Pro — Budgie`,
    metaDescription: msg`Stop paying monthly to track your money. Budgie's core features are free; the optional one-time unlock is yours forever. Offline-first and private.`,
    primaryKeyword: 'budget app no subscription',
    seoKeywords: [
        'budget app no subscription',
        'one-time purchase budget app',
        'no monthly fee expense tracker',
        'pay once finance app',
        'no subscription personal finance'
    ],
    relatedFeatureSlugs: ['offline-first-expense-tracker', 'monobank-sync', 'spending-analytics', 'open-source-budget-app-mobile'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07',
    ogTags: ['pricing', 'comparison', 'subscription-free']
} satisfies FeatureRegistryEntryInterface;
