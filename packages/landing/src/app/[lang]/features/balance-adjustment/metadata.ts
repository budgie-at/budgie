import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'balance-adjustment',
    tier: FeatureTierEnum.CORE,
    title: msg`Balance Adjustment`,
    tagline: msg`Correct an account balance without pretending it was income or an expense.`,
    metaTitle: msg`Balance Adjustment — Budgie`,
    metaDescription: msg`Set the balance your bank shows and Budgie books the difference as a dated Adjustment transaction, not a silent edit. First-class, editable, and excluded from your rules.`,
    primaryKeyword: 'balance adjustment app',
    seoKeywords: [
        'balance adjustment app',
        'reconcile account balance',
        'correct account balance',
        'starting balance tracker',
        'net worth correction'
    ],
    relatedFeatureSlugs: ['account-management', 'net-worth-tracker', 'multi-currency'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
    publishedAt: '2026-09-11',
    updatedAt: '2026-09-11',
    ogTags: ['balance', 'reconcile', 'accounts']
} satisfies FeatureRegistryEntryInterface;
