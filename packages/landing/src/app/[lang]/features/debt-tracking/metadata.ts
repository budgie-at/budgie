import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'debt-tracking',
    tier: FeatureTierEnum.POWER,
    title: msg`Debt & Loan Tracking`,
    tagline: msg`Money out, money in — first-class accounts with target balances, return dates, and contact assignment.`,
    metaTitle: msg`Debt & Loan Tracking — Budgie`,
    metaDescription: msg`Track money lent to friends or borrowed from others as first-class debt accounts with explicit direction, target balances, return dates, and contact links. Attach a repayment you already recorded, and value cross-currency debts at the historical rate.`,
    primaryKeyword: 'personal debt tracker app',
    seoKeywords: ['personal debt tracker app', 'loan tracker app', 'IOU tracker', 'debt direction tracker', 'lent and borrowed app'],
    relatedFeatureSlugs: ['account-management', 'net-worth-tracker', 'multi-currency'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'historical-exchange-rates-budget-analytics'],
    publishedAt: '2025-12-29',
    updatedAt: '2026-09-02',
    ogTags: ['debt', 'loans', 'contacts']
} satisfies FeatureRegistryEntryInterface;
