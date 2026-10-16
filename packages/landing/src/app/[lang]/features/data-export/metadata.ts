import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'data-export',
    tier: FeatureTierEnum.CORE,
    pillar: PillarEnum.PRIVACY,
    name: msg`Data Export`,
    tagline: msg`CSV for spreadsheets. A full database backup for restore. Both yours, never ours.`,
    metaTitle: msg`Data Export — Own Your Expense History — Budgie`,
    metaDescription: msg`One-tap CSV export of your transactions plus a compressed full backup, PIN-locked if you set a PIN. Save it to iCloud, Drive, or anywhere.`,
    primaryKeyword: 'export transactions CSV',
    seoKeywords: [
        'export transactions CSV',
        'export expense data',
        'CSV expense export app',
        'database backup expense tracker',
        'budget app data export'
    ],
    relatedFeatureSlugs: ['database-backup', 'csv-import', 'pin-app-lock'],
    relatedArticleSlugs: ['open-source-budgeting-transparency', 'local-first-movement-developers'],
    publishedAt: '2025-12-21',
    updatedAt: '2026-09-06',
    ogTags: ['export', 'csv', 'backup']
} satisfies FeatureRegistryEntryInterface;
