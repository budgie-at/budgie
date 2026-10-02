import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'binance-sync',
    tier: FeatureTierEnum.POWER,
    title: msg`Binance Sync — Read-Only Keys, Real Balances`,
    tagline: msg`Spot, Funding, and Simple Earn balances plus P2P, trades, and rewards — signed with a read-only API key.`,
    metaTitle: msg`Binance Account Sync — Budgie`,
    metaDescription: msg`Connect Binance with a read-only API key. Spot, Funding, and Simple Earn balances, P2P orders, trades, Convert, and Earn rewards sync to your device, and P2P buys merge with the matching bank payment.`,
    primaryKeyword: 'binance portfolio sync app',
    seoKeywords: [
        'binance portfolio sync app',
        'binance read-only api key tracker',
        'binance p2p tracking',
        'crypto and bank in one app',
        'binance simple earn balance'
    ],
    relatedFeatureSlugs: [
        'crypto-investment-tracking',
        'monobank-sync',
        'bank-integration-management',
        'net-worth-tracker',
        'transfer-pair-detection',
        'multi-currency'
    ],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'cloud-budgeting-privacy-risks'],
    publishedAt: '2026-09-02',
    updatedAt: '2026-09-02',
    ogTags: ['binance', 'crypto', 'sync']
} satisfies FeatureRegistryEntryInterface;
