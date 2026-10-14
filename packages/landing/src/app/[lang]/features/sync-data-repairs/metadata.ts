import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'sync-data-repairs',
    tier: FeatureTierEnum.POWER,
    title: msg`Sync Data Repairs`,
    tagline: msg`Finds duplicate imports and fixes transfers that were split or mismatched — manual entries are never touched.`,
    metaTitle: msg`Sync Data Repairs — Budgie`,
    metaDescription: msg`A Settings screen scans your PrivatBank and Erste imports for duplicates and mismatched transfers, shows a count, and repairs only after you confirm.`,
    primaryKeyword: 'duplicate bank transaction fixer',
    seoKeywords: [
        'duplicate bank transaction fixer',
        'remove duplicate bank imports',
        'bank sync repair tool',
        'duplicate transaction cleanup',
        'sync data repair'
    ],
    relatedFeatureSlugs: ['bank-integration-management', 'monobank-sync', 'bank-resync-window', 'transfer-pair-detection'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'cloud-budgeting-privacy-risks'],
    publishedAt: '2026-09-11',
    updatedAt: '2026-10-14',
    ogTags: ['sync', 'repair', 'duplicates']
} satisfies FeatureRegistryEntryInterface;
