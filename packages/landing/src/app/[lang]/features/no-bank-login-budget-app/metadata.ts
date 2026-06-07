import { msg } from '@lingui/core/macro';

import { FeatureCategoryEnum } from '../../../../feature/constant/feature-category.enum';
import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'no-bank-login-budget-app',
    tier: FeatureTierEnum.CORE,
    category: FeatureCategoryEnum.COMPARISON,
    title: msg`Budget App Without Bank Login — Direct API or Statement Import`,
    tagline: msg`Aggregators sit between you and your bank, mirroring every transaction to their servers. Budgie talks to your bank directly via tokens or imports statements you download yourself.`,
    metaTitle: msg`Budget App Without Bank Login — No Aggregator — Budgie`,
    metaDescription: msg`Skip the aggregator. Budgie syncs Monobank via your personal API token and imports any bank's PDF or CSV statement directly. Your credentials never leave you.`,
    primaryKeyword: 'budget app without bank login',
    seoKeywords: [
        'budget app without bank login',
        'no aggregator expense tracker',
        'budget app without credentials',
        'self-import bank statement app',
        'direct bank api budget app'
    ],
    relatedFeatureSlugs: ['monobank-sync', 'csv-import', 'erste-bank-pdf-import', 'privatbank-import', 'private-budget-app-alternative'],
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'offline-first-bank-data-safety'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07',
    ogTags: ['privacy', 'aggregator', 'bank-sync']
} satisfies FeatureRegistryEntryInterface;
