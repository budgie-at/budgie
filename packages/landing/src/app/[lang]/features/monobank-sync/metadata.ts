import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'monobank-sync',
    tier: FeatureTierEnum.HERO,
    title: msg`Monobank Expense Tracker — Direct Sync, No Middleman`,
    tagline: msg`Direct from Monobank. No aggregator. Your history on your device.`,
    metaTitle: msg`Monobank Auto-Sync — Budgie`,
    metaDescription: msg`Connect Monobank with a personal token. Cards and jars, the history depth you choose, and exchange rates sync straight to your device — no aggregator.`,
    primaryKeyword: 'monobank expense tracker',
    seoKeywords: ['monobank sync', 'monobank api', 'monobank expense tracker', 'monobank jar tracking', 'monobank budget app'],
    relatedFeatureSlugs: [
        'sync-data-repairs',
        'installment-tracking',
        'expense-tracking',
        'bulk-categorize-transactions',
        'bank-integration-management',
        'binance-sync',
        'bank-resync-window',
        'bank-fee-tracking',
        'csv-import',
        'erste-bank-pdf-import',
        'privatbank-import'
    ],
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'budgie-offline-financial-data', 'offline-first-bank-data-safety'],
    publishedAt: '2025-12-25',
    updatedAt: '2026-10-14',
    ogTags: ['monobank', 'bank sync', 'privacy']
} satisfies FeatureRegistryEntryInterface;
