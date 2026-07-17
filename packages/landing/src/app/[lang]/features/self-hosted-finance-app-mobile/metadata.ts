import { msg } from '@lingui/core/macro';

import { FeatureCategoryEnum } from '../../../../feature/constant/feature-category.enum';
import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'self-hosted-finance-app-mobile',
    tier: FeatureTierEnum.POWER,
    category: FeatureCategoryEnum.COMPARISON,
    title: msg`Self-Hosted Finance App on Mobile — Without Running a Server`,
    tagline: msg`Self-hosting promises privacy but ships a server you have to babysit. Budgie gives you the same data ownership with zero ops — your phone is the server.`,
    metaTitle: msg`Self-Hosted Budget App Mobile — No Server Needed — Budgie`,
    metaDescription: msg`Get the privacy of self-hosted finance apps without running a server. Budgie's data lives on your phone; your cloud handles backups. Zero ops, full ownership.`,
    primaryKeyword: 'self-hosted budget mobile app',
    seoKeywords: [
        'self-hosted budget mobile app',
        'self-hosted finance no server',
        'no server budget app',
        'on-device personal finance',
        'mobile-first self-hosted'
    ],
    relatedFeatureSlugs: ['offline-first-expense-tracker', 'database-backup', 'data-export', 'open-source-budget-app-mobile'],
    relatedArticleSlugs: ['local-first-movement-developers', 'budgie-offline-financial-data'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07',
    ogTags: ['self-hosted', 'privacy', 'no-server']
} satisfies FeatureRegistryEntryInterface;
