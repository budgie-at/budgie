import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'pin-app-lock',
    tier: FeatureTierEnum.CORE,
    title: msg`PIN App Lock — Nothing Opens Without Your PIN or Biometrics`,
    tagline: msg`A 4-digit PIN guards the app, with a growing wait after wrong tries and optional fingerprint or face unlock.`,
    metaTitle: msg`PIN Lock Finance App — Private Expense Tracker — Budgie`,
    metaDescription: msg`A 4-digit PIN opens Budgie, with a growing wait after wrong tries and optional biometric unlock. No cloud account.`,
    primaryKeyword: 'PIN lock finance app',
    seoKeywords: ['PIN lock finance app', 'finance app lock', 'budget app PIN', 'PIN-protected expense tracker', 'finance app screen lock'],
    relatedFeatureSlugs: ['biometric-authentication', 'screenshot-protection', 'expense-tracking', 'database-backup'],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
    publishedAt: '2025-12-18',
    updatedAt: '2026-05-03',
    ogTags: ['security', 'pin', 'lock']
} satisfies FeatureRegistryEntryInterface;
