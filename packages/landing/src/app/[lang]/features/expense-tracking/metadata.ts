import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'expense-tracking',
    tier: FeatureTierEnum.CORE,
    title: msg`Expense Tracking, Reimagined`,
    tagline: msg`Two taps from open to saved — a bottom-sheet quick-entry form designed for one-handed use.`,
    metaTitle: msg`Expense Tracking, Reimagined — Budgie`,
    metaDescription: msg`Log expenses, income, and transfers in seconds. Budgie tracks every transaction on-device with smart suggestions and zero cloud accounts.`,
    primaryKeyword: 'personal expense tracker',
    seoKeywords: [
        'personal expense tracker',
        'expense tracking app',
        'log expenses fast',
        'mobile expense logger',
        'expense tracker bottom sheet'
    ],
    relatedFeatureSlugs: [
        'voice-transaction-entry',
        'custom-categories',
        'transaction-tags',
        'split-transactions',
        'recurring-payments-calendar'
    ],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2025-12-14',
    updatedAt: '2026-05-03',
    ogTags: ['expense tracking', 'transactions', 'mobile']
} satisfies FeatureRegistryEntryInterface;
