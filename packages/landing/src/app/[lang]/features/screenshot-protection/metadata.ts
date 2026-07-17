import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'screenshot-protection',
    tier: FeatureTierEnum.NICHE,
    title: msg`Screenshot Protection — Hide Bank Balance from Previews`,
    tagline: msg`Accidental shares stay private — balances blur in screenshots and the app switcher.`,
    metaTitle: msg`Screenshot Protection — Budgie`,
    metaDescription: msg`Sensitive balances and amounts blur automatically in screenshots and the app switcher preview. Configurable per screen.`,
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
