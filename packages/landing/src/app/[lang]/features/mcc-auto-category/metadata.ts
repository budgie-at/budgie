import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'mcc-auto-category',
    tier: FeatureTierEnum.POWER,
    pillar: PillarEnum.AI,
    name: msg`MCC Auto-Categorization`,
    tagline: msg`Bank-issued codes do the work: cafes land in Restaurants & Cafes, fuel stops in Car & Fuel.`,
    metaTitle: msg`MCC Auto-Categorization for Bank Transactions — Budgie`,
    metaDescription: msg`Bank transactions carry Merchant Category Codes; Budgie maps about 1,050 of them to default categories automatically. Switch it off in Settings.`,
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
        'categorization-rules',
        'uncategorized-transactions',
        'bulk-categorize-transactions',
        'privatbank-import',
        'erste-bank-pdf-import',
        'date-filter-presets'
    ],
    relatedArticleSlugs: ['mint-alternatives-developers', 'ynab-alternatives-privacy'],
    publishedAt: '2026-01-02',
    updatedAt: '2026-05-03',
    ogTags: ['mcc', 'categorization', 'bank sync']
} satisfies FeatureRegistryEntryInterface;
