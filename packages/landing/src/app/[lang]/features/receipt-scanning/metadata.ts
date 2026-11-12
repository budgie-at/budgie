import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';
import { PillarEnum } from '../../../../feature/constant/pillar.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'receipt-scanning',
    tier: FeatureTierEnum.CORE,
    pillar: PillarEnum.AI,
    name: msg`Receipt Scanning`,
    tagline: msg`Scan a receipt and confirm a ready-to-save expense. Reading stays on your iPhone.`,
    metaTitle: msg`Receipt Scanning on iPhone — Budgie`,
    metaDescription: msg`Scan a receipt with the camera or pick it from Photos or Files. Text is read on your iPhone, and you confirm a prefilled expense or attach it to a bank purchase.`,
    seoKeywords: [
        'receipt scanner app',
        'scan receipts expense tracker',
        'receipt scanning iPhone',
        'private receipt scanner',
        'scan receipt to expense',
        'attach receipt to transaction'
    ],
    relatedFeatureSlugs: ['expense-tracking', 'categorization-rules', 'home-screen-widgets', 'eu-bank-sync'],
    relatedArticleSlugs: ['apple-pay-shortcuts-instructions', 'cloud-budgeting-privacy-risks'],
    publishedAt: '2026-11-12',
    updatedAt: '2026-11-12'
} satisfies FeatureRegistryEntryInterface;
