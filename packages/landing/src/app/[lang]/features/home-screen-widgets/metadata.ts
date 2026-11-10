import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'home-screen-widgets',
    tier: FeatureTierEnum.POWER,
    pillar: PillarEnum.PLANNING,
    name: msg`Home Screen Widgets`,
    tagline: msg`Net worth, budget, and quick add, right on your iPhone Home Screen. No need to open the app.`,
    metaTitle: msg`Home Screen Widgets — Budgie`,
    metaDescription: msg`Add net worth, budget, and quick-add widgets to your iPhone Home Screen. Check your numbers at a glance, then tap straight into adding a transaction.`,
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
    updatedAt: '2026-09-27'
} satisfies FeatureRegistryEntryInterface;
