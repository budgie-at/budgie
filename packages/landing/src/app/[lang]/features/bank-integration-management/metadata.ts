import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'bank-integration-management',
    tier: FeatureTierEnum.CORE,
    pillar: PillarEnum.BANK,
    name: msg`Bank Connections`,
    tagline: msg`Monobank cards, jars, and your deposits share one connection, so a token change is a one-time job.`,
    metaTitle: msg`Bank Connection Management — Budgie`,
    metaDescription: msg`One connection backs every account under it. Change a Monobank or Binance token once and all follow. Statement banks need no token.`,
    primaryKeyword: 'manage bank connections app',
    seoKeywords: [
        'manage bank connections app',
        'bank integration management',
        'one token multiple accounts',
        'bank sync token update',
        'multi account bank sync'
    ],
    relatedFeatureSlugs: [
        'sync-data-repairs',
        'monobank-sync',
        'privatbank-import',
        'erste-bank-pdf-import',
        'deposit-tracking',
        'binance-sync',
        'account-management'
    ],
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'local-first-movement-developers'],
    publishedAt: '2026-09-02',
    updatedAt: '2026-09-02',
    ogTags: ['bank sync', 'accounts', 'credentials']
} satisfies FeatureRegistryEntryInterface;
