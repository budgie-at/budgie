import { msg } from '@lingui/core/macro';

import { FeatureCategoryEnum } from '../../../../feature/constant/feature-category.enum';
import { FeatureTierEnum } from '../../../../feature/constant/feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../../../../feature/interface/feature-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */
export const FEATURE_METADATA = {
    slug: 'open-source-budget-app-mobile',
    tier: FeatureTierEnum.CORE,
    category: FeatureCategoryEnum.COMPARISON,
    title: msg`Source-Available Budget App for Mobile — Audit, Fork, Trust`,
    tagline: msg`Closed-source finance apps ask you to trust marketing. Budgie's mobile app has public source, so the privacy and security claims are auditable line by line.`,
    metaTitle: msg`Source-Available Mobile Budget App — Auditable Privacy — Budgie`,
    metaDescription: msg`Budgie is a source-available mobile budget app. Read the network code, verify the offline-first claims, fork it if we ever go in the wrong direction.`,
    primaryKeyword: 'source available mobile budget app',
    seoKeywords: [
        'source available mobile budget app',
        'auditable budget app',
        'public source iOS budget app',
        'public source Android budget app',
        'GitHub budget app'
    ],
    relatedFeatureSlugs: ['offline-first-expense-tracker', 'private-budget-app-alternative', 'self-hosted-finance-app-mobile'],
    relatedArticleSlugs: ['open-source-budgeting-transparency'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07',
    ogTags: ['open-source', 'transparency', 'github']
} satisfies FeatureRegistryEntryInterface;
