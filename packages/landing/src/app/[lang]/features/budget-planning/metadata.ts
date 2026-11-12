import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'budget-planning',
    tier: FeatureTierEnum.HERO,
    pillar: PillarEnum.PLANNING,
    name: msg`Budget Planning`,
    tagline: msg`Weekly to yearly budgets with category limits, rollover, safe to spend, sinking funds and on-device alerts.`,
    metaTitle: msg`Budget Planning: Weekly, Monthly, Sinking Funds — Budgie`,
    metaDescription: msg`Weekly, biweekly, monthly or yearly budgets with category limits, rollover, a daily safe-to-spend figure, sinking funds and event budgets. Alerts run on your device. No server involved.`,
    seoKeywords: [
        'sinking funds app',
        'weekly budget app',
        'safe to spend',
        'budget planning app',
        'category budget limits',
        'offline budget alerts'
    ],
    relatedFeatureSlugs: [
        'spending-analytics',
        'custom-categories',
        'expense-tracking',
        'multi-currency',
        'recurring-payments-calendar',
        'database-backup',
        'family-sharing',
        'siri-budget-questions',
        'sinking-funds'
    ],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-shutdown-private-alternative'],
    publishedAt: '2026-09-02',
    updatedAt: '2026-11-12'
} satisfies FeatureRegistryEntryInterface;
