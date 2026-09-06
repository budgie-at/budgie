import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'data-export',
    tier: FeatureTierEnum.CORE,
    title: msg`Export Every Transaction You've Logged`,
    tagline: msg`CSV for spreadsheets. Encrypted database backup for restore. Both yours, never ours.`,
    metaTitle: msg`Data Export — Own Your Expense History — Budgie`,
    metaDescription: msg`One-tap CSV export of all transactions, plus a full encrypted database backup file you can save to iCloud, Drive, or anywhere. Your data, your call.`,
    primaryKeyword: 'export transactions CSV',
    seoKeywords: [
        'export transactions CSV',
        'export expense data',
        'CSV expense export app',
        'database backup expense tracker',
        'budget app data export'
    ],
    relatedFeatureSlugs: ['database-backup', 'csv-import'],
    relatedArticleSlugs: ['open-source-budgeting-transparency', 'local-first-movement-developers'],
    publishedAt: '2025-12-21',
    updatedAt: '2026-09-06',
    ogTags: ['export', 'csv', 'backup']
} satisfies FeatureRegistryEntryInterface;
