import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'csv-import',
    tier: FeatureTierEnum.CORE,
    title: msg`CSV Bank Statement Import`,
    tagline: msg`Any bank, any column order — set it up once per source, then it's two taps from there.`,
    metaTitle: msg`CSV Import for Bank Statements & Transactions — Budgie`,
    metaDescription: msg`Import any bank's CSV with flexible column mapping, save the mapping as a preset, and re-import safely with deduplication. Universal escape hatch for banks without an API.`,
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
