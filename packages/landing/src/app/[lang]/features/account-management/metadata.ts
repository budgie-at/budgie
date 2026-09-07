import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'account-management',
    tier: FeatureTierEnum.CORE,
    title: msg`Multi-Account Money Management`,
    tagline: msg`Bank, cash, deposit, crypto, debt — all on one home screen, each with its own color.`,
    metaTitle: msg`Multi-Account Money Management — Budgie`,
    metaDescription: msg`Track bank, cash, deposit, crypto, and debt accounts in one private app. Crypto groups by currency, archive or mark inactive, and multi-currency net worth control.`,
    primaryKeyword: 'money management app',
    seoKeywords: [
        'money management app',
        'multi-account budget app',
        'unlimited accounts tracker',
        'crypto and bank tracker',
        'mobile money manager'
    ],
    relatedFeatureSlugs: ['net-worth-tracker', 'multi-currency', 'deposit-tracking', 'debt-tracking', 'crypto-investment-tracking'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
    publishedAt: '2025-11-17',
    updatedAt: '2026-09-07',
    ogTags: ['accounts', 'management', 'multi-account']
} satisfies FeatureRegistryEntryInterface;
