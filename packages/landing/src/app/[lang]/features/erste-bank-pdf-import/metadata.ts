import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'erste-bank-pdf-import',
    tier: FeatureTierEnum.CORE,
    title: msg`Erste Bank PDF Import`,
    tagline: msg`Import the statement PDF you download in George — every transaction in seconds.`,
    metaTitle: msg`Erste Bank PDF Import — Budgie`,
    metaDescription: msg`Import your Erste Bank statement from the PDF you download in George. IBAN, balance, and every transaction line are read on your device.`,
    primaryKeyword: 'Erste Bank statement import',
    seoKeywords: [
        'Erste Bank statement import',
        'Erste PDF import',
        'Erste Bank transaction import',
        'Austrian bank statement import',
        'Erste statement to budget app'
    ],
    relatedFeatureSlugs: ['csv-import', 'privatbank-import', 'monobank-sync', 'bank-integration-management', 'mcc-auto-category'],
    relatedArticleSlugs: ['mint-shutdown-private-alternative', 'cloud-budgeting-privacy-risks'],
    publishedAt: '2026-02-04',
    updatedAt: '2026-10-14',
    ogTags: ['erste', 'pdf', 'import']
} satisfies FeatureRegistryEntryInterface;
