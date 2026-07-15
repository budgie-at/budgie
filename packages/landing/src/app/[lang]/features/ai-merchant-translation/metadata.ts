import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'ai-merchant-translation',
    tier: FeatureTierEnum.POWER,
    title: msg`AI Merchant Name Translation`,
    tagline: msg`Cyrillic, Greek, Arabic merchant strings — the on-device LLM transliterates and adds search keywords.`,
    metaTitle: msg`Foreign Merchant Name Normalizer — Budgie`,
    metaDescription: msg`Cyrillic, Greek, or Cyrillic-script merchant names get normalized to Latin so your transaction list reads cleanly. Runs on-device.`,
    primaryKeyword: 'foreign merchant name normalizer',
    seoKeywords: [
        'foreign merchant name normalizer',
        'bank statement translation app',
        'merchant name cleanup',
        'transliterate cyrillic merchants',
        'transaction description translator'
    ],
    relatedFeatureSlugs: ['spending-analytics', 'voice-transaction-entry', 'multi-language-app'],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
    publishedAt: '2026-02-07',
    updatedAt: '2026-05-03',
    ogTags: ['translation', 'ai', 'multilingual']
} satisfies FeatureRegistryEntryInterface;
