import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'voice-transaction-entry',
    tier: FeatureTierEnum.HERO,
    title: msg`Voice Transaction Entry`,
    tagline: msg`Speak it. Budgie logs it. whisper.rn (whisper.cpp backend) transcribes on-device — audio never leaves your phone.`,
    metaTitle: msg`Voice-to-Expense, On-Device — Budgie`,
    metaDescription: msg`Say "twelve for coffee, forty for the taxi, and eight euros for parking" and Budgie logs all three. whisper.rn (whisper.cpp backend) and the on-device LLM extract a reviewable batch — no audio ever streams to a server.`,
    primaryKeyword: 'voice expense tracker',
    seoKeywords: [
        'voice expense tracker',
        'voice budget app',
        'speech-to-text expenses',
        'voice transaction logging',
        'on-device whisper',
        'multi-transaction voice entry'
    ],
    relatedFeatureSlugs: ['ai-auto-categorization', 'expense-tracking', 'ai-merchant-translation'],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
    publishedAt: '2026-01-22',
    updatedAt: '2026-09-07',
    ogTags: ['voice', 'on-device', 'ai']
} satisfies FeatureRegistryEntryInterface;
