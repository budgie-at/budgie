import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'categorization-rules',
    tier: FeatureTierEnum.CORE,
    title: msg`Categorization Rules — Deterministic, Not Guesswork`,
    tagline: msg`If the title contains this and the MCC is that, set the category, add the tag, or make it a transfer.`,
    metaTitle: msg`Transaction Categorization Rules — Budgie`,
    metaDescription: msg`Build rules that match on title, comment, amount, MCC, account, type, or import source and automatically set a category, add a tag, or convert to a transfer — on every bank sync and import.`,
    primaryKeyword: 'transaction categorization rules',
    seoKeywords: [
        'transaction categorization rules',
        'auto categorize transactions',
        'expense tracker rules engine',
        'bank import rules',
        'automatic category assignment'
    ],
    relatedFeatureSlugs: [
        'ai-auto-categorization',
        'mcc-auto-category',
        'uncategorized-transactions',
        'custom-categories',
        'transaction-tags',
        'convert-to-transfer'
    ],
    relatedArticleSlugs: ['mint-alternatives-developers', 'ynab-alternatives-privacy'],
    publishedAt: '2026-09-02',
    updatedAt: '2026-09-02',
    ogTags: ['rules', 'categorization', 'automation']
} satisfies FeatureRegistryEntryInterface;
