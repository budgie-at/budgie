import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'icloud-sync',
    tier: FeatureTierEnum.CORE,
    pillar: PillarEnum.PRIVACY,
    name: msg`iCloud Sync and Backup`,
    tagline: msg`Your iPhone and iPad stay in sync through your own iCloud. No Budgie account, no Budgie server.`,
    metaTitle: msg`iCloud Sync and Backup — Budgie`,
    metaDescription: msg`Budgie syncs and backs up your iPhone and iPad through your own iCloud, even after days offline. Data is encrypted on your device before upload. No account, no server.`,
    seoKeywords: [
        'budget app icloud sync',
        'expense tracker icloud backup',
        'sync budget iphone ipad',
        'private budget app sync',
        'expense app no account sync',
        'restore budget app new iphone'
    ],
    relatedFeatureSlugs: ['database-backup', 'family-sharing', 'self-hosted-finance-app-mobile', 'pin-app-lock'],
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'local-first-movement-developers'],
    publishedAt: '2026-11-12',
    updatedAt: '2026-11-12'
} satisfies FeatureRegistryEntryInterface;
