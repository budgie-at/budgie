import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'ai-transaction-suggestions',
    tier: FeatureTierEnum.CORE,
    pillar: PillarEnum.AI,
    name: msg`Transaction Suggestions`,
    tagline: msg`Open the expense form and Budgie offers tappable suggestions from your own history: category, then tags, then a comment.`,
    metaTitle: msg`Smart Expense Suggestions for Mobile — Budgie`,
    metaDescription: msg`Budgie suggests category, tags, comment and amount from your own spending history as tappable pills — faster than typing, private, offline.`,
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
        'ai-category-translation'
    ],
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'local-first-movement-developers'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-09-07',
    ogTags: ['ai', 'suggestions', 'expense-tracking']
} satisfies FeatureRegistryEntryInterface;
