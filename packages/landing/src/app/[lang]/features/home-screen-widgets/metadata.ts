import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'home-screen-widgets',
    tier: FeatureTierEnum.POWER,
    title: msg`Home Screen Widgets`,
    tagline: msg`Net worth, budget, and quick add — right on your iPhone Home Screen, no need to open the app.`,
    metaTitle: msg`Home Screen Widgets — Budgie`,
    metaDescription: msg`Add net worth, budget, and quick-add widgets to your iPhone Home Screen. Check your numbers at a glance, then tap straight into adding a transaction.`,
    primaryKeyword: 'budget app home screen widget',
    seoKeywords: [
        'budget app home screen widget',
        'net worth widget iphone',
        'quick add expense widget',
        'ios budget widget app',
        'expense tracker widget'
    ],
    relatedFeatureSlugs: ['net-worth-tracker', 'budget-planning', 'expense-tracking', 'pin-app-lock', 'runway'],
    relatedArticleSlugs: ['ynab-alternatives-privacy'],
    publishedAt: '2026-09-27',
    updatedAt: '2026-09-27',
    ogTags: ['widgets', 'home screen', 'quick add']
} satisfies FeatureRegistryEntryInterface;
