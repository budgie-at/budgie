import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'bank-resync-window',
    tier: FeatureTierEnum.POWER,
    title: msg`Windowed Bank Re-sync`,
    tagline: msg`Re-pull a slice. Keep your edits. No nuke-from-orbit.`,
    metaTitle: msg`Bank Re-Sync Window — Backfill Missing Transactions — Budgie`,
    metaDescription: msg`Re-pull just the last N days of bank history without nuking your manual edits or category overrides. Conflict picker for edited rows.`,
    primaryKeyword: 'bank sync history reset',
    seoKeywords: [
        'bank sync history reset',
        're-sync window app',
        'partial bank re-import',
        'edited transaction conflict',
        'bank statement diff'
    ],
    relatedFeatureSlugs: ['monobank-sync', 'csv-import', 'account-transfers', 'transfer-pair-detection'],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'mint-alternatives-developers'],
    publishedAt: '2026-05-02',
    updatedAt: '2026-05-03',
    ogTags: ['bank sync', 're-sync', 'edits']
} satisfies FeatureRegistryEntryInterface;
