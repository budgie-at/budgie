import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'privatbank-import',
    tier: FeatureTierEnum.CORE,
    title: msg`PrivatBank XLSX Import`,
    tagline: msg`XLSX, MCC-mapped, two taps — long-press an account card to re-import.`,
    metaTitle: msg`PrivatBank XLSX Import — Budgie`,
    metaDescription: msg`Import accounts and transactions from a PrivatBank24 XLSX export. PrivatBank's MCC categories map to ISO codes automatically so AI categorization downstream still works.`,
    primaryKeyword: 'PrivatBank transaction import',
    seoKeywords: [
        'PrivatBank transaction import',
        'PrivatBank24 XLSX import',
        'PrivatBank to budget app',
        'Ukrainian bank import',
        'PrivatBank statement parser'
    ],
    relatedFeatureSlugs: ['csv-import', 'erste-bank-pdf-import', 'monobank-sync', 'mcc-auto-category'],
    relatedArticleSlugs: ['mint-alternatives-developers', 'budgie-offline-financial-data'],
    publishedAt: '2026-02-02',
    updatedAt: '2026-05-03',
    ogTags: ['privatbank', 'xlsx', 'import']
} satisfies FeatureRegistryEntryInterface;
