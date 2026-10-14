import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'net-worth-tracker',
    tier: FeatureTierEnum.HERO,
    pillar: PillarEnum.PLANNING,
    name: msg`Net Worth Tracker`,
    tagline: msg`Bank, cash, deposit, crypto, and debt in one number on your home screen.`,
    metaTitle: msg`Net Worth Tracker for Mobile — Budgie`,
    metaDescription: msg`Roll up every bank account, cash wallet, deposit, crypto holding, and liability into a single net-worth number. Multi-currency conversion baked in.`,
    primaryKeyword: 'net worth tracker app',
    seoKeywords: [
        'net worth tracker app',
        'net worth dashboard',
        'multi-account net worth',
        'crypto net worth tracker',
        'mobile net worth app'
    ],
    relatedFeatureSlugs: ['balance-adjustment', 'account-management', 'multi-currency', 'debt-tracking', 'crypto-investment-tracking'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2026-01-03',
    updatedAt: '2026-09-06',
    ogTags: ['net worth', 'multi-currency', 'dashboard']
} satisfies FeatureRegistryEntryInterface;
