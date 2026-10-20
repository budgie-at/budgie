import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'ai-tag-suggestions',
    tier: FeatureTierEnum.POWER,
    pillar: PillarEnum.AI,
    name: msg`Tag Suggestions`,
    tagline: msg`After picking a category, Budgie proposes the tags you usually use as tappable pills, from your own history, on your phone.`,
    metaTitle: msg`Automatic Expense Tags — On-Device — Budgie`,
    metaDescription: msg`Budgie suggests the tags you usually use for a merchant as tappable pills, so heavy taggers stop typing. Private and offline.`,
    primaryKeyword: 'automatic expense tags',
    seoKeywords: [
        'automatic expense tags',
        'AI tag suggestions',
        'on-device tag prediction',
        'expense tag autocomplete',
        'offline tag suggestions'
    ],
    relatedFeatureSlugs: ['transaction-tags', 'tag-analytics', 'ai-auto-categorization', 'ai-transaction-suggestions', 'primary-tag'],
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'local-first-movement-developers'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-09-16',
    ogTags: ['ai', 'tags', 'suggestions']
} satisfies FeatureRegistryEntryInterface;
