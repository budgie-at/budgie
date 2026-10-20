import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'bank-resync-window',
    tier: FeatureTierEnum.POWER,
    pillar: PillarEnum.BANK,
    name: msg`Bank Re-sync Window`,
    tagline: msg`Re-pull a slice. Keep your category and comments. No full reset.`,
    metaTitle: msg`Bank Re-Sync Window — Budgie`,
    metaDescription: msg`Re-pull just the last 7, 30 or 90 days of bank history without a full reset. Your category, tags and own comments are kept.`,
    primaryKeyword: 'bank sync history reset',
    seoKeywords: [
        'bank sync history reset',
        're-sync window app',
        'partial bank re-import',
        'resync bank transactions',
        'bank statement diff'
    ],
    relatedFeatureSlugs: ['sync-data-repairs', 'monobank-sync', 'csv-import', 'account-transfers', 'transfer-pair-detection'],
    relatedArticleSlugs: ['mint-shutdown-private-alternative', 'cloud-budgeting-privacy-risks'],
    publishedAt: '2026-05-02',
    updatedAt: '2026-10-14',
    ogTags: ['bank sync', 're-sync', 'edits']
} satisfies FeatureRegistryEntryInterface;
