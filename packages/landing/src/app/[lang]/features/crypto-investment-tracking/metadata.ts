import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'crypto-investment-tracking',
    tier: FeatureTierEnum.NICHE,
    title: msg`Crypto, Stocks, ETFs — All In One Place`,
    tagline: msg`Bitcoin to ETFs in one dashboard, alongside your bank accounts.`,
    metaTitle: msg`Crypto & Investment Tracking — Budgie`,
    metaDescription: msg`Track Bitcoin, Ethereum, AAPL, S&P 500 ETFs, and gold alongside bank accounts in a single net-worth view. Each holding is an instrument + quantity + price.`,
    primaryKeyword: 'crypto portfolio tracker app',
    seoKeywords: [
        'crypto portfolio tracker app',
        'crypto + bank tracker',
        'investment tracker mobile',
        'ETF portfolio app',
        'multi-asset net worth'
    ],
    relatedFeatureSlugs: ['net-worth-tracker', 'account-management', 'multi-currency'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2025-11-17',
    updatedAt: '2026-05-03',
    ogTags: ['crypto', 'stocks', 'etf']
} satisfies FeatureRegistryEntryInterface;
