import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'inzhur-fund-tracking',
    tier: FeatureTierEnum.NICHE,
    pillar: PillarEnum.BANK,
    name: msg`Inzhur Fund Tracking`,
    tagline: msg`Import your Inzhur operations export and see holdings, value and return on what you paid.`,
    metaTitle: msg`Inzhur Fund Tracking — Budgie`,
    metaDescription: msg`Import your Inzhur operations export into Budgie. Buys, sells, dividends and tax land in your cash account, and each fund page shows holdings, value and return on what you paid. Stays on your device.`,
    seoKeywords: [
        'inzhur tracker',
        'inzhur certificates',
        'track inzhur investments',
        'inzhur dividends tax',
        'ukrainian real estate fund tracker',
        'inzhur net worth'
    ],
    relatedFeatureSlugs: ['deposit-tracking', 'crypto-investment-tracking', 'net-worth-tracker', 'privatbank-import', 'multi-currency'],
    relatedArticleSlugs: ['uah-eur-budget-ukrainians-in-eu', 'monobank-expense-tracking'],
    publishedAt: '2026-11-12',
    updatedAt: '2026-11-12'
} satisfies FeatureRegistryEntryInterface;
