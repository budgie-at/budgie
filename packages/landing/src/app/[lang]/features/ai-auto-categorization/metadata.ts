import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'ai-auto-categorization',
    tier: FeatureTierEnum.HERO,
    title: msg`On-Device AI Auto-Categorization`,
    tagline: msg`Category, tag, and merchant suggestions that run entirely on your phone and learn from your corrections.`,
    metaTitle: msg`On-Device AI Auto-Categorization — Budgie`,
    metaDescription: msg`Category, tag, and merchant suggestions that run entirely on your phone, learn from your corrections, and never reach a server.`,
    primaryKeyword: 'AI expense categorization',
    seoKeywords: [
        'AI expense categorization',
        'on-device AI budget app',
        'private AI finance',
        'offline AI expense tracker',
        'machine learning expense categorization'
    ],
    relatedFeatureSlugs: [
        'offline-first-expense-tracker',
        'voice-transaction-entry',
        'mcc-auto-category',
        'categorization-rules',
        'custom-categories',
        'uncategorized-transactions',
        'recurring-payments-calendar'
    ],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app', 'on-device-ai-budget-app-explainer'],
    publishedAt: '2026-02-06',
    updatedAt: '2026-09-16',
    ogTags: ['ai', 'on-device', 'privacy']
} satisfies FeatureRegistryEntryInterface;
