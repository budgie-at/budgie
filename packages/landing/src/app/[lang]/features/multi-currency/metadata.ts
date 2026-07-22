import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'multi-currency',
    tier: FeatureTierEnum.POWER,
    title: msg`Multi-Currency Accounts With Live Rates`,
    tagline: msg`Track in any currency. Sum in yours. Daily FX-rate refresh keeps the math fair.`,
    metaTitle: msg`Multi-Currency Accounts — Budgie`,
    metaDescription: msg`Hold accounts in any currency. A nightly background task fetches fresh FX rates so dashboards always show in your home currency. Cross-currency transfers preserve both legs.`,
    primaryKeyword: 'multi currency expense tracker',
    seoKeywords: [
        'multi currency expense tracker',
        'multi-currency budget app',
        'FX-aware expense tracker',
        'mobile currency conversion app',
        'foreign currency tracker'
    ],
    relatedFeatureSlugs: ['account-management', 'net-worth-tracker', 'account-transfers', 'crypto-investment-tracking'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers', 'historical-exchange-rates-budget-analytics'],
    publishedAt: '2025-12-19',
    updatedAt: '2026-05-03',
    ogTags: ['multi-currency', 'fx', 'accounts']
} satisfies FeatureRegistryEntryInterface;
