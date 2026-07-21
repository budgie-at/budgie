import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'account-management',
    tier: FeatureTierEnum.CORE,
    title: msg`Multi-Account Money Management`,
    tagline: msg`Bank, cash, savings, crypto, stocks, debt — all on one home screen.`,
    metaTitle: msg`Multi-Account Money Management — Budgie`,
    metaDescription: msg`Track checking, savings, credit cards, cash, and brokerage accounts in one private app. Multi-currency, offline-first, no bank login required.`,
    primaryKeyword: 'money management app',
    seoKeywords: [
        'money management app',
        'multi-account budget app',
        'unlimited accounts tracker',
        'crypto and bank tracker',
        'mobile money manager'
    ],
    relatedFeatureSlugs: ['net-worth-tracker', 'multi-currency', 'debt-tracking', 'crypto-investment-tracking'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
    publishedAt: '2025-11-17',
    updatedAt: '2026-05-03',
    ogTags: ['accounts', 'management', 'multi-account']
} satisfies FeatureRegistryEntryInterface;
