import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'screenshot-protection',
    tier: FeatureTierEnum.NICHE,
    pillar: PillarEnum.PRIVACY,
    name: msg`Screenshot Protection`,
    tagline: msg`Ask your phone to block screen capture and hide amounts in the app switcher with one switch in Settings.`,
    metaTitle: msg`Screenshot Protection — Budgie`,
    metaDescription: msg`One switch asks your phone to block screenshots and screen recordings and hides amounts when Budgie is in the background. Off by default.`,
    primaryKeyword: 'hide bank balance screenshot',
    seoKeywords: [
        'hide bank balance screenshot',
        'screenshot protection finance app',
        'app switcher blur',
        'private balance app',
        'no-screenshot finance app'
    ],
    relatedFeatureSlugs: ['pin-app-lock', 'biometric-authentication', 'database-backup', 'expense-tracking'],
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'local-first-movement-developers'],
    publishedAt: '2025-12-23',
    updatedAt: '2026-05-03',
    ogTags: ['privacy', 'screenshots', 'security']
} satisfies FeatureRegistryEntryInterface;
