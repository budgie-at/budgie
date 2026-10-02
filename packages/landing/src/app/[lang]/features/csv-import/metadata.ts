import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'csv-import',
    tier: FeatureTierEnum.CORE,
    title: msg`CSV Bank Statement Import`,
    tagline: msg`Any bank, any column order — map it on one screen or start from a built-in preset.`,
    metaTitle: msg`CSV Import for Bank Statements & Transactions — Budgie`,
    metaDescription: msg`Import any bank's CSV with flexible column mapping, or start from a built-in Budgie, SmartBudget or FinEye preset. Re-importing rebuilds your ledger from the file. Universal escape hatch for banks without an API.`,
    primaryKeyword: 'import bank statement CSV',
    seoKeywords: [
        'import bank statement CSV',
        'CSV bank import app',
        'flexible CSV column mapping',
        'CSV import preset',
        'bank statement importer'
    ],
    relatedFeatureSlugs: ['erste-bank-pdf-import', 'privatbank-import', 'monobank-sync', 'data-export', 'bank-resync-window'],
    relatedArticleSlugs: ['mint-alternatives-developers', 'budgie-offline-financial-data', 'historical-exchange-rates-budget-analytics'],
    publishedAt: '2025-12-21',
    updatedAt: '2026-05-03',
    ogTags: ['csv', 'import', 'bank statement']
} satisfies FeatureRegistryEntryInterface;
