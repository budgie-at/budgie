import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'sinking-funds',
    tier: FeatureTierEnum.POWER,
    pillar: PillarEnum.PLANNING,
    name: msg`Sinking Funds and Event Budgets`,
    tagline: msg`Set money aside for yearly bills, budget a trip on its own and let limits tune themselves.`,
    metaTitle: msg`Sinking Funds and Trip Budgets — Budgie`,
    metaDescription: msg`Set money aside each period for annual bills, budget a trip with its own limit and let Budgie nudge category limits by at most 10%. Works offline, no subscription.`,
    seoKeywords: [
        'sinking funds app',
        'budget for annual bills',
        'trip budget app',
        'travel budget tracker',
        'event budget planner',
        'yearly bills savings'
    ],
    relatedFeatureSlugs: ['budget-planning', 'recurring-payments-calendar', 'transaction-tags', 'runway'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-shutdown-private-alternative'],
    publishedAt: '2026-11-12',
    updatedAt: '2026-11-12'
} satisfies FeatureRegistryEntryInterface;
