import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'screenshot-protection',
    tier: FeatureTierEnum.NICHE,
    title: msg`Screenshot Protection — Hide Bank Balance from Previews`,
    tagline: msg`Block screen capture and hide amounts in the app switcher with one switch in Settings.`,
    metaTitle: msg`Screenshot Protection — Budgie`,
    metaDescription: msg`One switch blocks screenshots and screen recordings and hides amounts when Budgie is in the background. Off by default.`,
    primaryKeyword: 'hide bank balance screenshot',
    seoKeywords: [
        'hide bank balance screenshot',
        'screenshot protection finance app',
        'app switcher blur',
        'private balance app',
        'no-screenshot finance app'
    ],
    relatedFeatureSlugs: ['pin-app-lock', 'biometric-authentication'],
    relatedArticleSlugs: ['budgie-offline-financial-data', 'cloud-budgeting-privacy-risks'],
    publishedAt: '2025-12-23',
    updatedAt: '2026-05-03',
    ogTags: ['privacy', 'screenshots', 'security']
} satisfies FeatureRegistryEntryInterface;
