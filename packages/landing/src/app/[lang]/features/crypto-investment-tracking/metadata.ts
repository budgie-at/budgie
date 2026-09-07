import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'crypto-investment-tracking',
    tier: FeatureTierEnum.NICHE,
    title: msg`Crypto Holdings Alongside Your Cash`,
    tagline: msg`Two hundred crypto assets in one dashboard, alongside your bank accounts.`,
    metaTitle: msg`Crypto Portfolio Tracking — Budgie`,
    metaDescription: msg`Track Bitcoin, Ethereum, and 200 crypto assets alongside your bank accounts in one net-worth view. The largest ship with a year of daily price history.`,
    primaryKeyword: 'crypto portfolio tracker app',
    seoKeywords: [
        'crypto portfolio tracker app',
        'crypto + bank tracker',
        'bitcoin portfolio tracker app',
        'crypto net worth tracker',
        'crypto price history app'
    ],
    relatedFeatureSlugs: ['binance-sync', 'net-worth-tracker', 'account-management', 'multi-currency'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'historical-exchange-rates-budget-analytics'],
    publishedAt: '2025-11-17',
    updatedAt: '2026-09-06',
    ogTags: ['crypto', 'bitcoin', 'net worth']
} satisfies FeatureRegistryEntryInterface;
