import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'deposit-tracking',
    tier: FeatureTierEnum.POWER,
    title: msg`Deposit Tracking`,
    tagline: msg`Fixed-term savings kept separate from everyday spending, with maturity dates and expected payout math.`,
    metaTitle: msg`Deposit Tracking — Budgie`,
    metaDescription: msg`Track fixed-term deposits as a dedicated account type with interest rate, maturity date, days remaining, expected payout, close-to-account transfers, and net worth control.`,
    primaryKeyword: 'deposit tracker app',
    seoKeywords: [
        'deposit tracker app',
        'fixed deposit tracker',
        'savings maturity date tracker',
        'interest payout calculator app',
        'net worth deposit account'
    ],
    relatedFeatureSlugs: ['account-management', 'bank-integration-management', 'net-worth-tracker', 'account-transfers', 'debt-tracking'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
    publishedAt: '2026-08-13',
    updatedAt: '2026-08-13',
    ogTags: ['deposit', 'interest', 'maturity']
} satisfies FeatureRegistryEntryInterface;
