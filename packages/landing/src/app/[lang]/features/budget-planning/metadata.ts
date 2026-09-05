import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'budget-planning',
    tier: FeatureTierEnum.HERO,
    title: msg`Budget Planning — Limits That Match Your Payday`,
    tagline: msg`One overall limit, per-category limits, and a cap for everything else — with a home-screen widget and on-device alerts.`,
    metaTitle: msg`Monthly Budget Planning — Budgie`,
    metaDescription: msg`Set an overall monthly limit plus per-category limits, start the cycle on your payday, watch progress from the home screen, and get on-device alerts at 80% and 100%. No server involved.`,
    primaryKeyword: 'monthly budget app',
    seoKeywords: ['monthly budget app', 'budget planning app', 'category budget limits', 'offline budget alerts', 'payday budget cycle'],
    relatedFeatureSlugs: [
        'spending-analytics',
        'custom-categories',
        'expense-tracking',
        'multi-currency',
        'recurring-payments-calendar',
        'offline-first-expense-tracker'
    ],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2026-09-02',
    updatedAt: '2026-09-02',
    ogTags: ['budget', 'limits', 'alerts']
} satisfies FeatureRegistryEntryInterface;
