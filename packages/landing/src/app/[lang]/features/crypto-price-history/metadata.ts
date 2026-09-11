import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'crypto-price-history',
    tier: FeatureTierEnum.POWER,
    title: msg`Crypto Price History`,
    tagline: msg`A price chart that lives in your own database — price card, sparkline and period metrics, offline.`,
    metaTitle: msg`Crypto Price History — Budgie`,
    metaDescription: msg`Every crypto holding has its own market screen with a price card, sparkline and period metrics. A year of daily prices ships in the app; older history backfills from CoinGecko in the background, on-device, one day at a time.`,
    primaryKeyword: 'crypto price history app',
    seoKeywords: [
        'crypto price history app',
        'offline crypto chart',
        'local crypto price tracking',
        'coin price sparkline',
        'crypto market data offline'
    ],
    relatedFeatureSlugs: ['crypto-investment-tracking', 'binance-sync', 'net-worth-tracker', 'multi-currency'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
    publishedAt: '2026-09-11',
    updatedAt: '2026-09-11',
    ogTags: ['crypto', 'prices', 'offline']
} satisfies FeatureRegistryEntryInterface;
