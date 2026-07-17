import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'multi-language-app',
    tier: FeatureTierEnum.NICHE,
    title: msg`Budgie in Five Languages`,
    tagline: msg`English, Ukrainian, French, German, Spanish — full UI, locale-aware formatting.`,
    metaTitle: msg`Multi-Language App — Budgie`,
    metaDescription: msg`Full UI in English, Ukrainian, French, German, and Spanish. Auto-detected from device locale, switchable in-app — no reinstall, no relaunch.`,
    primaryKeyword: 'multilingual budget app',
    seoKeywords: [
        'multilingual budget app',
        '5 languages expense tracker',
        'localized finance app',
        'i18n budget app',
        'language switcher expense app'
    ],
    relatedFeatureSlugs: ['ai-merchant-translation', 'dark-mode'],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
    publishedAt: '2025-11-17',
    updatedAt: '2026-05-03',
    ogTags: ['i18n', 'languages', 'multilingual']
} satisfies FeatureRegistryEntryInterface;
