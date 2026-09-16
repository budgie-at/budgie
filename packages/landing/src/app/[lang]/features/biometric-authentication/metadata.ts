import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'biometric-authentication',
    tier: FeatureTierEnum.CORE,
    title: msg`Face ID / Touch ID Authentication`,
    tagline: msg`One glance unlocks the screen — your four-digit PIN stays the encryption key underneath.`,
    metaTitle: msg`Biometric Authentication — Budgie`,
    metaDescription: msg`Face ID or Touch ID unlocks the lock screen instantly; the OS matches, Budgie only sees the result. Your PIN stays the real encryption key, no device-passcode fallback.`,
    primaryKeyword: 'Face ID and Touch ID expense app',
    seoKeywords: [
        'Face ID expense app',
        'Touch ID expense app',
        'biometric finance app',
        'fingerprint lock screen app',
        'private expense tracker biometrics'
    ],
    relatedFeatureSlugs: ['pin-app-lock', 'screenshot-protection', 'offline-first-expense-tracker'],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
    publishedAt: '2025-12-18',
    updatedAt: '2026-09-16',
    ogTags: ['biometric', 'face id', 'touch id', 'security']
} satisfies FeatureRegistryEntryInterface;
