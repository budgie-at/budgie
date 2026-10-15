import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'dark-mode',
    tier: FeatureTierEnum.NICHE,
    title: msg`True Dark Mode (Not Just Dimmed)`,
    tagline: msg`A black dark theme that follows your device until you switch it.`,
    metaTitle: msg`Dark Mode Budget App — Easy on the Eyes — Budgie`,
    metaDescription: msg`A black dark theme that follows your device by default. One switch in Settings turns dark mode on or off.`,
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
