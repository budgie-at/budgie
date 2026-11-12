import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'siri-budget-questions',
    tier: FeatureTierEnum.POWER,
    pillar: PillarEnum.PLANNING,
    name: msg`Ask Siri About Your Budget`,
    tagline: msg`Ask Siri what you spent, what is left and what is due, without opening the app.`,
    metaTitle: msg`Ask Siri About Your Budget — Budgie`,
    metaDescription: msg`Ask Siri how much you spent on groceries, what is left in your budget, your balances, net worth and charges due in 7 days. Read-only, answered on your iPhone, hidden behind your PIN.`,
    seoKeywords: [
        'siri budget app',
        'ask siri about spending',
        'siri expense tracker',
        'siri account balance',
        'siri shortcuts budget',
        'voice budget questions iphone'
    ],
    relatedFeatureSlugs: ['pin-app-lock', 'budget-planning', 'net-worth-tracker', 'recurring-payments-calendar', 'home-screen-widgets'],
    relatedArticleSlugs: ['apple-pay-shortcuts-instructions', 'cloud-budgeting-privacy-risks'],
    publishedAt: '2026-11-12',
    updatedAt: '2026-11-12'
} satisfies FeatureRegistryEntryInterface;
