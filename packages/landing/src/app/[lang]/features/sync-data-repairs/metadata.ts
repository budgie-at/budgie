import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'sync-data-repairs',
    tier: FeatureTierEnum.POWER,
    title: msg`Sync Data Repairs`,
    tagline: msg`Finds duplicate imports and pairs your own-card transfers that arrived as two separate rows — manual entries are never touched.`,
    metaTitle: msg`Sync Data Repairs — Budgie`,
    metaDescription: msg`A dedicated Settings screen scans your imported banking connections for duplicate transactions and unmatched own-card transfers, showing a count before you confirm. It soft-deletes duplicate copies and pairs matched transfer legs. Manual transactions stay untouched.`,
    primaryKeyword: 'duplicate bank transaction fixer',
    seoKeywords: [
        'duplicate bank transaction fixer',
        'remove duplicate bank imports',
        'bank sync repair tool',
        'duplicate transaction cleanup',
        'sync data repair'
    ],
    relatedFeatureSlugs: ['bank-integration-management', 'monobank-sync', 'bank-resync-window', 'transfer-pair-detection'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
    publishedAt: '2026-09-11',
    updatedAt: '2026-09-16',
    ogTags: ['sync', 'repair', 'duplicates']
} satisfies FeatureRegistryEntryInterface;
