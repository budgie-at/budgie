import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'recurring-payments-calendar',
    tier: FeatureTierEnum.POWER,
    title: msg`Recurring Payments Calendar`,
    tagline: msg`Spot the slow leak before it bills — subscription patterns plotted on a month calendar with forecasted upcoming.`,
    metaTitle: msg`Recurring Payments Calendar — Budgie`,
    metaDescription: msg`Budgie auto-detects subscription and recurring-payment patterns from your history and plots them on a monthly calendar so you can see upcoming bills within the current month.`,
    primaryKeyword: 'recurring payment tracker',
    seoKeywords: [
        'recurring payment tracker',
        'subscription tracker app',
        'monthly bill calendar',
        'forecast bills budget app',
        'recurring expense detector'
    ],
    relatedFeatureSlugs: ['spending-analytics', 'ai-auto-categorization', 'date-filter-presets', 'expense-tracking'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2026-02-22',
    updatedAt: '2026-05-07',
    ogTags: ['recurring', 'subscriptions', 'calendar']
} satisfies FeatureRegistryEntryInterface;
