import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'pin-app-lock',
    tier: FeatureTierEnum.CORE,
    title: msg`PIN App Lock — Locks With the Encryption Key`,
    tagline: msg`The PIN unlocks the app and unlocks SQLCipher — no PIN, no readable database.`,
    metaTitle: msg`PIN Lock Finance App — Private Expense Tracker — Budgie`,
    metaDescription: msg`Budgie's PIN doesn't just gate the screen — it derives the SQLCipher encryption key. Without the PIN, the database file is unreadable, even with full filesystem access.`,
    primaryKeyword: 'PIN lock finance app',
    seoKeywords: [
        'PIN lock finance app',
        'encrypted finance app',
        'SQLCipher mobile',
        'PIN-protected expense tracker',
        'finance app screen lock'
    ],
    relatedFeatureSlugs: ['biometric-authentication', 'screenshot-protection', 'offline-first-expense-tracker', 'database-backup'],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
    publishedAt: '2025-12-18',
    updatedAt: '2026-05-03',
    ogTags: ['security', 'pin', 'encryption']
} satisfies FeatureRegistryEntryInterface;
