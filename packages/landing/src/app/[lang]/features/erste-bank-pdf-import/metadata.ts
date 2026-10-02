import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'erste-bank-pdf-import',
    tier: FeatureTierEnum.CORE,
    title: msg`Erste Bank PDF Import`,
    tagline: msg`Classic and modern PDF formats — full statement import in seconds.`,
    metaTitle: msg`Erste Bank PDF Import — Budgie`,
    metaDescription: msg`Import your full Erste Bank statement straight from PDF — both classic and the new 2026 modern format. Account holder, IBAN, balances, and every transaction line parsed.`,
    primaryKeyword: 'Erste Bank statement import',
    seoKeywords: [
        'Erste Bank statement import',
        'Erste PDF import',
        'Erste Bank transaction parser',
        'Austrian bank statement import',
        'Erste statement to budget app'
    ],
    relatedFeatureSlugs: ['csv-import', 'privatbank-import', 'monobank-sync', 'bank-integration-management', 'mcc-auto-category'],
    relatedArticleSlugs: ['mint-alternatives-developers', 'budgie-offline-financial-data'],
    publishedAt: '2026-02-04',
    updatedAt: '2026-05-03',
    ogTags: ['erste', 'pdf', 'import']
} satisfies FeatureRegistryEntryInterface;
