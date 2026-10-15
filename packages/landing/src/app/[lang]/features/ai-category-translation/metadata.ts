import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'ai-category-translation',
    tier: FeatureTierEnum.POWER,
    title: msg`AI Category & Tag Translation`,
    tagline: msg`Category and tag names in non-Latin scripts, such as Cyrillic, get an English form and search keywords — on your phone.`,
    metaTitle: msg`Category & Tag Translation, On-Device — Budgie`,
    metaDescription: msg`Category and tag names in other scripts get an English form and keywords, so search matches either. Runs on your phone.`,
    primaryKeyword: 'category translation budget app',
    seoKeywords: ['category translation budget app', 'translate expense categories', 'multilingual expense categories'],
    relatedFeatureSlugs: ['spending-analytics', 'voice-transaction-entry', 'multi-language-app'],
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'local-first-movement-developers'],
    publishedAt: '2026-02-07',
    updatedAt: '2026-09-16',
    ogTags: ['translation', 'ai', 'multilingual']
} satisfies FeatureRegistryEntryInterface;
