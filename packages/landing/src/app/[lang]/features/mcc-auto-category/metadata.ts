import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'mcc-auto-category',
    tier: FeatureTierEnum.POWER,
    title: msg`MCC Auto-Categorization`,
    tagline: msg`Bank-issued codes do the work — coffee shops land in Food & Drink, gas stations in Transport.`,
    metaTitle: msg`MCC Auto-Categorization for Bank Transactions — Budgie`,
    metaDescription: msg`Bank-synced transactions carry Merchant Category Codes; Budgie maps them to your category tree automatically. Per-MCC overrides for personal preferences.`,
    primaryKeyword: 'automatic transaction categories',
    seoKeywords: [
        'automatic transaction categories',
        'MCC auto category',
        'merchant category code app',
        'MCC mapping budget app',
        'bank-issued category codes'
    ],
    relatedFeatureSlugs: [
        'ai-auto-categorization',
        'uncategorized-transactions',
        'privatbank-import',
        'erste-bank-pdf-import',
        'date-filter-presets'
    ],
    relatedArticleSlugs: ['mint-alternatives-developers', 'ynab-alternatives-privacy'],
    publishedAt: '2026-01-02',
    updatedAt: '2026-05-03',
    ogTags: ['mcc', 'categorization', 'bank sync']
} satisfies FeatureRegistryEntryInterface;
