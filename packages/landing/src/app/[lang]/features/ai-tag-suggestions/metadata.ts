import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'ai-tag-suggestions',
    tier: FeatureTierEnum.POWER,
    title: msg`Automatic Tag Suggestions — Tap, Don't Type`,
    tagline: msg`After picking a category, the on-device model proposes up to three tags as tappable pills. A lighter fallback answers while it loads or is busy.`,
    metaTitle: msg`Automatic Expense Tags — On-Device — Budgie`,
    metaDescription: msg`Budgie's local model suggests up to three tags per transaction so heavy taggers stop typing. A lighter fallback answers while it loads.`,
    primaryKeyword: 'automatic expense tags',
    seoKeywords: [
        'automatic expense tags',
        'AI tag suggestions',
        'on-device tag prediction',
        'expense tag autocomplete',
        'offline tag suggestions'
    ],
    relatedFeatureSlugs: ['transaction-tags', 'tag-analytics', 'ai-auto-categorization', 'ai-transaction-suggestions', 'primary-tag'],
    relatedArticleSlugs: ['budgie-offline-financial-data'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-09-16',
    ogTags: ['ai', 'tags', 'suggestions']
} satisfies FeatureRegistryEntryInterface;
