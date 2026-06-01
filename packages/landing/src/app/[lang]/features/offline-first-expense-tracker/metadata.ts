import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'offline-first-expense-tracker',
    tier: FeatureTierEnum.HERO,
    title: msg`Offline-First Expense Tracker`,
    tagline: msg`Every transaction lives on your device. No cloud account, no sign-up.`,
    metaTitle: msg`Offline-First Expense Tracker — Budgie`,
    metaDescription: msg`Budgie is a 100% offline-first expense tracker. Your financial data never leaves your phone — encrypted SQLite, no cloud servers, no account required to start.`,
    primaryKeyword: 'offline expense tracker app',
    seoKeywords: [
        'offline expense tracker',
        'offline budget app',
        'private finance app',
        'no account budget app',
        'local-first expense tracker'
    ],
    relatedFeatureSlugs: ['monobank-sync', 'ai-auto-categorization', 'pin-app-lock', 'database-backup', 'biometric-authentication'],
    relatedArticleSlugs: ['offline-first-privacy-financial-app', 'budgie-offline-financial-data', 'mint-shutdown-private-alternative'],
    publishedAt: '2025-12-01',
    updatedAt: '2026-05-03',
    ogTags: ['offline-first', 'privacy', 'expense tracker']
} satisfies FeatureRegistryEntryInterface;
