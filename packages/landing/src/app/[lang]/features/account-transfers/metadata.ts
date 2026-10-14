import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'account-transfers',
    tier: FeatureTierEnum.CORE,
    pillar: PillarEnum.PLANNING,
    name: msg`Account Transfers`,
    tagline: msg`Cross-currency, dual-amount, exact. Money between your own accounts is never an expense.`,
    metaTitle: msg`Account Transfers — Budgie`,
    metaDescription: msg`Transfer between your own accounts as a first-class transaction type with automatic FX conversion and dual-amount display. Spending stats stay clean; balance reconciliation stays exact.`,
    primaryKeyword: 'transfer between accounts app',
    seoKeywords: [
        'transfer between accounts app',
        'cross-currency transfer tracker',
        'first-class transfers app',
        'dual-amount transfer',
        'FX transfer tracking'
    ],
    relatedFeatureSlugs: ['transfer-pair-detection', 'transaction-long-press-menu', 'multi-currency', 'bank-resync-window'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
    publishedAt: '2025-12-19',
    updatedAt: '2026-05-03',
    ogTags: ['transfers', 'multi-currency', 'accounts']
} satisfies FeatureRegistryEntryInterface;
