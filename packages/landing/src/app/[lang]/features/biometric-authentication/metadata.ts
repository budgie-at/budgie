import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'biometric-authentication',
    tier: FeatureTierEnum.CORE,
    title: msg`Face ID / Touch ID Authentication`,
    tagline: msg`Bank-grade biometric unlock — same Secure Enclave, same encryption key.`,
    metaTitle: msg`Biometric Authentication — Budgie`,
    metaDescription: msg`Face ID / Touch ID unlock that drives the same SQLCipher encryption key as your PIN. Frictionless, falls back to PIN when needed, respects platform lockout policy.`,
    primaryKeyword: 'Face ID expense app',
    seoKeywords: [
        'Face ID expense app',
        'Touch ID budget app',
        'biometric finance app',
        'Secure Enclave expense tracker',
        'biometric unlock finance'
    ],
    relatedFeatureSlugs: ['pin-app-lock', 'screenshot-protection', 'offline-first-expense-tracker'],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
    publishedAt: '2025-12-18',
    updatedAt: '2026-05-03',
    ogTags: ['biometric', 'face id', 'security']
} satisfies FeatureRegistryEntryInterface;
