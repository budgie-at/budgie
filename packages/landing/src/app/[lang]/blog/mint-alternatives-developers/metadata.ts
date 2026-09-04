import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'mint-alternatives-developers',
    date: '2025-02-05',
    author: 'Budgie Team',
    readingTimeMinutes: 18,
    title: msg`Mint Shutdown: Where Developers Are Moving Their Finances`,
    description: msg`A comprehensive developer's guide to Mint alternatives after the shutdown. Detailed comparison of Budgie, Actual Budget, Firefly III, Lunch Money, YNAB, and more.`,
    tags: ['mint-alternatives', 'budget-apps', 'developer-tools', 'open-source', 'privacy', 'personal-finance'],
    seoKeywords: ['Mint alternatives', 'developer budget app', 'Mint shutdown replacement'],
    seoDescription: msg`Comprehensive developer's guide to Mint alternatives: detailed comparison of privacy-focused budget apps including Budgie, Actual Budget, Firefly III, and more.`,
    relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
    relatedFeatureSlugs: ['offline-first-expense-tracker', 'csv-import', 'monobank-sync', 'multi-currency']
};

/* oxlint-enable lingui/no-unlocalized-strings */
