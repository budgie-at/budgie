import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'database-backup',
    tier: FeatureTierEnum.CORE,
    title: msg`Database Backup & Restore`,
    tagline: msg`One compressed backup file, PIN-locked once you set a PIN. No account, restore by picking the file.`,
    metaTitle: msg`PIN-Locked Database Backup — Budgie`,
    metaDescription: msg`Back up your entire Budgie database as one compressed file, PIN-locked if you set a PIN. Save it anywhere and restore by picking the file.`,
    primaryKeyword: 'expense tracker backup restore',
    seoKeywords: [
        'expense tracker backup restore',
        'finance app backup file',
        'mobile budget backup',
        'restore expense data',
        'no-account backup app'
    ],
    relatedFeatureSlugs: ['data-export', 'pin-app-lock', 'expense-tracking'],
    relatedArticleSlugs: ['open-source-budgeting-transparency', 'local-first-movement-developers'],
    publishedAt: '2025-12-21',
    updatedAt: '2026-05-03',
    ogTags: ['backup', 'restore', 'encryption']
} satisfies FeatureRegistryEntryInterface;
