import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'dark-mode',
    tier: FeatureTierEnum.NICHE,
    title: msg`True Dark Mode (Not Just Dimmed)`,
    tagline: msg`OLED-friendly black, locale-aware, no white flash on cold launch.`,
    metaTitle: msg`Dark Mode Budget App — Easy on the Eyes — Budgie`,
    metaDescription: msg`System-adaptive dark theme that respects OLED displays. Switch with your device, or lock to dark or light. Charts recompute palette for legibility.`,
    primaryKeyword: 'dark mode expense tracker',
    seoKeywords: [
        'dark mode expense tracker',
        'OLED budget app',
        'system theme finance app',
        'dark mode finance app',
        'true black expense app'
    ],
    relatedFeatureSlugs: ['multi-language-app'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2025-11-17',
    updatedAt: '2026-05-03',
    ogTags: ['dark mode', 'ui', 'theme']
} satisfies FeatureRegistryEntryInterface;
