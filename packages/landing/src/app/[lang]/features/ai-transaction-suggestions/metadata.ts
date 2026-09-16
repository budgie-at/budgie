import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'ai-transaction-suggestions',
    tier: FeatureTierEnum.CORE,
    title: msg`Smart Transaction Suggestions — Tap and Done`,
    tagline: msg`Open the expense form and Budgie offers pill-shaped suggestions from your own history — category, tags, comment, and amount, all filled in.`,
    metaTitle: msg`Smart Expense Suggestions for Mobile — Budgie`,
    metaDescription: msg`Budgie fills in category, tags, comment, and amount from your own spending history — faster than typing, fully offline.`,
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
        'transaction-tags',
        'ai-merchant-translation'
    ],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-09-07',
    ogTags: ['ai', 'suggestions', 'expense-tracking']
} satisfies FeatureRegistryEntryInterface;
