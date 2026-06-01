import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'ai-transaction-suggestions',
    tier: FeatureTierEnum.CORE,
    title: msg`Smart Transaction Suggestions — Tap and Done`,
    tagline: msg`Open the expense form and Budgie offers pill-shaped suggestions from your own history — category, tags, comment, amount, account, all pre-filled.`,
    metaTitle: msg`Smart Expense Suggestions for Mobile — Budgie`,
    metaDescription: msg`Budgie suggests category, tags, and amount from your own SQL patterns and 768-dim embeddings. Faster manual entry than any AI cloud assistant.`,
    primaryKeyword: 'smart expense suggestions',
    seoKeywords: [
        'smart expense suggestions',
        'auto-fill expense form',
        'transaction prediction app',
        'on-device expense suggestions',
        'AI form pre-fill budget app'
    ],
    relatedFeatureSlugs: [
        'ai-auto-categorization',
        'recurring-payments-calendar',
        'expense-tracking',
        'ai-tag-suggestions',
        'transaction-tags'
    ],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07',
    ogTags: ['ai', 'suggestions', 'expense-tracking']
} satisfies FeatureRegistryEntryInterface;
