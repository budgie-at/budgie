import { msg } from '@lingui/core/macro';

import { FeatureCategoryEnum } from '../../../../feature/constant/feature-category.enum';
import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'on-device-ai-budget-app',
    tier: FeatureTierEnum.HERO,
    category: FeatureCategoryEnum.COMPARISON,
    title: msg`On-Device AI Budget App — AI That Never Leaves Your Phone`,
    tagline: msg`Cloud AI assistants for budgeting send every transaction to a remote server for "intelligence". Budgie's AI runs on your phone — your data never leaves.`,
    metaTitle: msg`On-Device AI Budget App — No Cloud AI — Budgie`,
    metaDescription: msg`Categorization, tag suggestions, and voice entry all run on your phone. One opt-in download, then no cloud AI, no account, no subscription.`,
    primaryKeyword: 'on-device AI budget app',
    seoKeywords: [
        'on-device AI budget app',
        'private AI finance app',
        'offline AI expense tracker',
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
    updatedAt: '2026-09-16',
    ogTags: ['ai', 'on-device', 'privacy', 'offline']
} satisfies FeatureRegistryEntryInterface;
