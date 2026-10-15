import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'biometric-authentication',
    tier: FeatureTierEnum.CORE,
    title: msg`Face ID, Touch ID and Fingerprint Unlock`,
    tagline: msg`One glance or touch unlocks the screen — your four-digit PIN stays behind it.`,
    metaTitle: msg`Biometric Authentication — Budgie`,
    metaDescription: msg`Unlock with Face ID, Touch ID or Android fingerprint or face. The phone matches, Budgie only sees the result. PIN stays the fallback.`,
    primaryKeyword: 'Face ID and Touch ID expense app',
    seoKeywords: [
        'Face ID expense app',
        'Touch ID expense app',
        'biometric finance app',
        'fingerprint lock screen app',
        'private expense tracker biometrics'
    ],
    relatedFeatureSlugs: ['pin-app-lock', 'screenshot-protection', 'expense-tracking'],
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'local-first-movement-developers'],
    publishedAt: '2025-12-18',
    updatedAt: '2026-09-16',
    ogTags: ['biometric', 'face id', 'touch id', 'security']
} satisfies FeatureRegistryEntryInterface;
