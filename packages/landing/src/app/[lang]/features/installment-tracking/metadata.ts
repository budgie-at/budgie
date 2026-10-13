import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'installment-tracking',
    tier: FeatureTierEnum.POWER,
    title: msg`Pay in Parts: Installment Tracking`,
    tagline: msg`Turn a purchase paid in parts into a plan. Budgie attaches each monthly part and shows the next payment on Home.`,
    metaTitle: msg`Installment Tracker for Pay in Parts Purchases`,
    metaDescription: msg`Know what you still owe on things you bought in parts. Turn the purchase into a plan, and Budgie attaches each monthly part and shows the next payment.`,
    primaryKeyword: 'installment tracker app',
    seoKeywords: [
        'installment tracker app',
        'pay in parts tracker',
        'buy now pay later tracker',
        'installment payment tracker',
        'track purchases paid in installments'
    ],
    relatedFeatureSlugs: ['debt-tracking', 'monobank-sync', 'privatbank-import', 'recurring-payments-calendar', 'transfer-pair-detection'],
    relatedArticleSlugs: ['whats-new-september-2026', 'ynab-alternatives-privacy'],
    publishedAt: '2026-10-06',
    updatedAt: '2026-10-06',
    ogTags: ['installments', 'pay in parts', 'debt']
} satisfies FeatureRegistryEntryInterface;
