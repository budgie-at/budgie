import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'monobank-sync',
    tier: FeatureTierEnum.HERO,
    title: msg`Monobank Expense Tracker — Direct API Sync, No Plaid`,
    tagline: msg`Direct API. No aggregator. Full transaction history to your device.`,
    metaTitle: msg`Monobank Auto-Sync — Budgie`,
    metaDescription: msg`Connect your Monobank account with a personal API token. Full transaction history, FX rates, and counter-IBANs sync straight to your device — no Plaid.`,
    primaryKeyword: 'monobank expense tracker',
    seoKeywords: ['monobank sync', 'monobank api', 'monobank expense tracker', 'monobank transaction import', 'monobank budget app'],
    relatedFeatureSlugs: [
        'offline-first-expense-tracker',
        'bank-resync-window',
        'bank-fee-tracking',
        'csv-import',
        'erste-bank-pdf-import',
        'privatbank-import'
    ],
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'budgie-offline-financial-data', 'offline-first-bank-data-safety'],
    publishedAt: '2025-12-25',
    updatedAt: '2026-05-07',
    ogTags: ['monobank', 'bank sync', 'privacy']
} satisfies FeatureRegistryEntryInterface;
