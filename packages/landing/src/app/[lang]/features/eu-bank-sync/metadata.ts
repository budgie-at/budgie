import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'eu-bank-sync',
    tier: FeatureTierEnum.HERO,
    pillar: PillarEnum.BANK,
    name: msg`EU Bank Sync`,
    tagline: msg`Sync N26, Trade Republic and other EU banks straight to your phone, with no Budgie server in between.`,
    metaTitle: msg`EU Bank Sync: N26, Trade Republic — Budgie`,
    metaDescription: msg`Connect EU banks such as N26 and Trade Republic through your own Enable Banking application. Transactions go from your bank to your phone. Budgie has no server and holds no bank credentials.`,
    seoKeywords: [
        'N26 expense tracker',
        'Trade Republic budget app',
        'EU bank sync app',
        'connect bank account budgeting app Europe',
        'private bank sync no aggregator',
        'Enable Banking budget app'
    ],
    relatedFeatureSlugs: ['monobank-sync', 'binance-sync', 'bank-integration-management', 'bank-resync-window', 'sync-data-repairs'],
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'ynab-alternatives-privacy'],
    publishedAt: '2026-11-12',
    updatedAt: '2026-11-12'
} satisfies FeatureRegistryEntryInterface;
