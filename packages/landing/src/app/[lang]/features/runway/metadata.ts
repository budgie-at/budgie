import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'runway',
    tier: FeatureTierEnum.POWER,
    title: msg`Runway: How Long Your Money Lasts`,
    tagline: msg`Months left at your current pace, or how much you add each month. Right next to your balance.`,
    metaTitle: msg`Runway: How Long Will My Money Last?`,
    metaDescription: msg`See how many months your cash and bank balance lasts at your current pace, when it runs out, and what drives your spending. Worked out on your phone.`,
    primaryKeyword: 'how long will my money last',
    seoKeywords: [
        'how long will my money last',
        'personal cash runway',
        'burn rate calculator app',
        'months of savings left',
        'cash flow forecast app'
    ],
    relatedFeatureSlugs: [
        'net-worth-tracker',
        'budget-planning',
        'spending-analytics',
        'crypto-investment-tracking',
        'recurring-payments-calendar'
    ],
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
    publishedAt: '2026-09-26',
    updatedAt: '2026-09-26',
    ogTags: ['runway', 'forecast', 'burn rate']
} satisfies FeatureRegistryEntryInterface;
