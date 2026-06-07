import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'database-backup',
    tier: FeatureTierEnum.CORE,
    title: msg`Database Backup & Restore`,
    tagline: msg`One encrypted file. No account. Restore on any device in seconds.`,
    metaTitle: msg`Encrypted Database Backup to Your Cloud — Budgie`,
    metaDescription: msg`Capture your entire Budgie database in one encrypted file. Save to iCloud or Drive on your terms; restore on a new device with one tap and your PIN.`,
    primaryKeyword: 'expense tracker backup restore',
    seoKeywords: [
        'expense tracker backup restore',
        'finance app backup file',
        'mobile budget backup',
        'restore expense data',
        'no-account backup app'
    ],
    relatedFeatureSlugs: ['data-export', 'pin-app-lock', 'offline-first-expense-tracker'],
    relatedArticleSlugs: ['open-source-budgeting-transparency', 'local-first-movement-developers'],
    publishedAt: '2025-12-21',
    updatedAt: '2026-05-03',
    ogTags: ['backup', 'restore', 'encryption']
} satisfies FeatureRegistryEntryInterface;
