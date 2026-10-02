import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'ai-category-translation',
    tier: FeatureTierEnum.POWER,
    title: msg`AI Category & Tag Translation`,
    tagline: msg`Cyrillic, Greek, and Arabic category and tag names become readable and searchable — on your phone.`,
    metaTitle: msg`Category & Tag Translation, On-Device — Budgie`,
    metaDescription: msg`Cyrillic, Greek, or Arabic category and tag names get an English form so search and suggestions match either script. Runs on-device.`,
    primaryKeyword: 'category translation budget app',
    seoKeywords: [
        'category translation budget app',
        'translate expense categories',
        'cyrillic category names',
        'multilingual expense categories',
        'transliterate categories and tags'
    ],
    relatedFeatureSlugs: ['spending-analytics', 'voice-transaction-entry', 'multi-language-app'],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
    publishedAt: '2026-02-07',
    updatedAt: '2026-09-16',
    ogTags: ['translation', 'ai', 'multilingual']
} satisfies FeatureRegistryEntryInterface;
