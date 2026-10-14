import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'expense-tracking',
    tier: FeatureTierEnum.CORE,
    name: msg`Expense Tracking`,
    tagline: msg`Two taps from open to saved. A bottom-sheet quick-entry form designed for one-handed use.`,
    metaTitle: msg`Expense Tracking App, Log in Seconds — Budgie`,
    metaDescription: msg`Log expenses, income, and transfers in seconds. Each transaction opens read-only with six months of comparable spending before you edit.`,
    primaryKeyword: 'personal expense tracker',
    seoKeywords: [
        'personal expense tracker',
        'expense tracking app',
        'log expenses fast',
        'mobile expense logger',
        'transaction detail view app'
    ],
    relatedFeatureSlugs: [
        'voice-transaction-entry',
        'custom-categories',
        'transaction-tags',
        'split-transactions',
        'budget-planning',
        'recurring-payments-calendar'
    ],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2025-12-14',
    updatedAt: '2026-09-02',
    ogTags: ['expense tracking', 'transactions', 'mobile']
} satisfies FeatureRegistryEntryInterface;
