import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'ynab-alternatives-privacy',
    date: '2025-02-03',
    author: 'Budgie Team',
    readingTimeMinutes: 17,
    title: msg`Best YNAB Alternatives for Privacy-Conscious Users`,
    description: msg`Comprehensive comparison of privacy-focused YNAB alternatives. Detailed reviews of Budgie, Actual Budget, Firefly III, and more with migration guide.`,
    tags: ['ynab', 'alternatives', 'privacy', 'comparison', 'budgeting', 'offline-first', 'open-source'],
    seoKeywords: ['YNAB alternatives', 'privacy budget app', 'YNAB replacement'],
    seoDescription: msg`Best YNAB alternatives for privacy-conscious users. Detailed comparison of offline-first, open-source budget apps with YNAB migration guide.`,
    relatedArticleSlugs: ['mint-alternatives-developers', 'cloud-budgeting-privacy-risks'],
    relatedFeatureSlugs: ['offline-first-expense-tracker', 'custom-categories', 'transaction-tags', 'recurring-payments-calendar']
};

/* oxlint-enable lingui/no-unlocalized-strings */
