import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'bank-integration-management',
    tier: FeatureTierEnum.CORE,
    title: msg`Bank Connections — One Credential, Many Accounts`,
    tagline: msg`Cards, jars, and deposits share a single connection, so a token change is a one-time job.`,
    metaTitle: msg`Bank Connection Management — Budgie`,
    metaDescription: msg`One bank connection holds the credential and backs every account under it — cards, jars, and deposits. Change the token once and all of them follow; close one account and the rest keep syncing.`,
    primaryKeyword: 'manage bank connections app',
    seoKeywords: [
        'manage bank connections app',
        'bank integration management',
        'one token multiple accounts',
        'bank sync token update',
        'multi account bank sync'
    ],
    relatedFeatureSlugs: [
        'monobank-sync',
        'privatbank-import',
        'erste-bank-pdf-import',
        'deposit-tracking',
        'binance-sync',
        'account-management'
    ],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-bank-data-safety'],
    publishedAt: '2026-09-02',
    updatedAt: '2026-09-02',
    ogTags: ['bank sync', 'accounts', 'credentials']
} satisfies FeatureRegistryEntryInterface;
