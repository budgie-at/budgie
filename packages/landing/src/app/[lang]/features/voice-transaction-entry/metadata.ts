import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'voice-transaction-entry',
    tier: FeatureTierEnum.HERO,
    title: msg`Voice Transaction Entry`,
    tagline: msg`Speak it. Budgie logs it. Speech is transcribed on your phone — the audio never leaves it.`,
    metaTitle: msg`Voice-to-Expense, On-Device — Budgie`,
    metaDescription: msg`Say "twelve for coffee, forty for the taxi, and eight euros for parking" and Budgie logs all three as a reviewable batch. The audio never leaves your phone.`,
    primaryKeyword: 'voice expense tracker',
    seoKeywords: [
        'voice expense tracker',
        'voice budget app',
        'speech-to-text expenses',
        'voice transaction logging',
        'offline voice entry',
        'multi-transaction voice entry'
    ],
    relatedFeatureSlugs: ['ai-auto-categorization', 'expense-tracking', 'ai-category-translation'],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
    publishedAt: '2026-01-22',
    updatedAt: '2026-09-16',
    ogTags: ['voice', 'on-device', 'ai']
} satisfies FeatureRegistryEntryInterface;
