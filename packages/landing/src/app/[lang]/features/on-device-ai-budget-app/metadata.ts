import { msg } from '@lingui/core/macro';

import { FeatureCategoryEnum } from '../../../../feature/constant/feature-category.enum';
import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'on-device-ai-budget-app',
    tier: FeatureTierEnum.HERO,
    category: FeatureCategoryEnum.COMPARISON,
    title: msg`On-Device AI Budget App — Local LLM, No Cloud Inference`,
    tagline: msg`Cloud AI assistants for budgeting send every transaction to a remote server for "intelligence". Budgie runs the LLM and embeddings on your phone — your data never leaves.`,
    metaTitle: msg`On-Device AI Budget App — Private LLM Categorization — Budgie`,
    metaDescription: msg`Budgie runs a 1.7B-parameter LLM and 768-dim embedding model on your phone for categorization, tag suggestions, and voice entry. No cloud AI, ever.`,
    primaryKeyword: 'on-device AI budget app',
    seoKeywords: [
        'on-device AI budget app',
        'private AI finance app',
        'local LLM expense tracker',
        'on-device AI categorization',
        'no cloud AI budget app'
    ],
    relatedFeatureSlugs: [
        'ai-auto-categorization',
        'voice-transaction-entry',
        'ai-transaction-suggestions',
        'ai-tag-suggestions',
        'ai-merchant-translation'
    ],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app', 'on-device-ai-budget-app-explainer'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07',
    ogTags: ['ai', 'on-device', 'privacy', 'llm']
} satisfies FeatureRegistryEntryInterface;
