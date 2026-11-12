import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'family-sharing',
    tier: FeatureTierEnum.HERO,
    pillar: PillarEnum.PLANNING,
    name: msg`Family Sharing`,
    tagline: msg`Share chosen accounts and budgets with your partner or family. Everything else stays private.`,
    metaTitle: msg`Family Budget App: Share with a Partner — Budgie`,
    metaDescription: msg`Budget with your partner or family through iCloud. Share only the accounts and budgets you pick. They can see and edit what you share; the rest stays private. iOS.`,
    seoKeywords: [
        'family budget app',
        'shared budget app for couples',
        'budget with partner',
        'shared expense tracker',
        'couples budgeting app',
        'family expense tracker iPhone'
    ],
    relatedFeatureSlugs: ['icloud-sync', 'account-management', 'budget-planning', 'net-worth-tracker'],
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'ynab-alternatives-privacy'],
    publishedAt: '2026-11-12',
    updatedAt: '2026-11-12'
} satisfies FeatureRegistryEntryInterface;
