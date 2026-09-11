import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'sync-data-repairs',
    tier: FeatureTierEnum.POWER,
    title: msg`Sync Data Repairs`,
    tagline: msg`Find duplicate imported bank transactions and soft-delete only the copies — your manual entries are never touched.`,
    metaTitle: msg`Sync Data Repairs — Budgie`,
    metaDescription: msg`A dedicated Settings screen scans every bank-sync source for duplicate imported transactions, shows the count per source, and soft-deletes only the imported copies after you confirm. Manual transactions stay untouched.`,
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
    updatedAt: '2026-09-11',
    ogTags: ['sync', 'repair', 'duplicates']
} satisfies FeatureRegistryEntryInterface;
