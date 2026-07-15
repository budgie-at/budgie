import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'transaction-tags',
    tier: FeatureTierEnum.CORE,
    title: msg`Transaction Tags for Multi-Dimensional Tracking`,
    tagline: msg`Layer tags on top of categories — one transaction can be Groceries (category) and #vacation, #shared, #reimbursable (tags).`,
    metaTitle: msg`Custom Transaction Tags for Expense Tracking — Budgie`,
    metaDescription: msg`Tags answer "for which project, person, or purpose" — separate from categories. Multi-select fast, promote a primary tag for at-a-glance scanning, and slice analytics per tag.`,
    primaryKeyword: 'transaction labels app',
    seoKeywords: ['transaction labels app', 'expense tagging app', 'tag transactions', 'project expense tags', 'shared expense tracker'],
    relatedFeatureSlugs: ['tag-analytics', 'primary-tag', 'custom-categories', 'expense-tracking', 'split-transactions'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2025-11-19',
    updatedAt: '2026-05-03',
    ogTags: ['tags', 'organization', 'analytics']
} satisfies FeatureRegistryEntryInterface;
