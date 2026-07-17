import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'ai-auto-categorization',
    tier: FeatureTierEnum.HERO,
    title: msg`On-Device AI Auto-Categorization`,
    tagline: msg`Two on-device models — Qwen3 1.7B for chat and a 768-dim embedding model — power category, tag, and merchant suggestions privately.`,
    metaTitle: msg`On-Device AI Auto-Categorization — Budgie`,
    metaDescription: msg`Budgie runs Qwen3 1.7B + a 768-dim embedding model on your phone. Two-stage categorization with corrections feeding the embedding index.`,
    primaryKeyword: 'AI expense categorization',
    seoKeywords: [
        'AI expense categorization',
        'on-device AI budget app',
        'private AI finance',
        'local LLM expense tracker',
        'machine learning expense categorization'
    ],
    relatedFeatureSlugs: [
        'offline-first-expense-tracker',
        'voice-transaction-entry',
        'mcc-auto-category',
        'custom-categories',
        'uncategorized-transactions',
        'recurring-payments-calendar'
    ],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app', 'on-device-ai-budget-app-explainer'],
    publishedAt: '2026-02-06',
    updatedAt: '2026-05-07',
    ogTags: ['ai', 'on-device', 'privacy']
} satisfies FeatureRegistryEntryInterface;
