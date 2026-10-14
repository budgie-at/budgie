import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'multi-currency',
    tier: FeatureTierEnum.POWER,
    title: msg`Multi-Currency Accounts, One Total`,
    tagline: msg`Track in any currency. Sum in yours. Exchange rates refresh in the background.`,
    metaTitle: msg`Multi-Currency Accounts — Budgie`,
    metaDescription: msg`Hold accounts in any currency. Rates refresh in the background so every total shows in your home currency. Cross-currency transfers keep both amounts.`,
    primaryKeyword: 'multi currency expense tracker',
    seoKeywords: [
        'multi currency expense tracker',
        'multi-currency budget app',
        'FX-aware expense tracker',
        'mobile currency conversion app',
        'foreign currency tracker'
    ],
    relatedFeatureSlugs: [
        'balance-adjustment',
        'account-management',
        'net-worth-tracker',
        'account-transfers',
        'crypto-investment-tracking'
    ],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-shutdown-private-alternative', 'historical-exchange-rates-budget-analytics'],
    publishedAt: '2025-12-19',
    updatedAt: '2026-05-03',
    ogTags: ['multi-currency', 'fx', 'accounts']
} satisfies FeatureRegistryEntryInterface;
