import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'open-source-budgeting-transparency',
    date: '2025-02-12',
    author: 'Budgie Team',
    image: '/images/design-mode/ai-budgeting-app-4x.jpg',
    readingTimeMinutes: 15,
    title: msg`Source-Available Budgeting: Why Transparency Matters for Your Money`,
    description: msg`Learn why public source matters for financial software, how to audit apps yourself, and how Budgie's transparent development protects your financial data.`,
    tags: ['source-available', 'transparency', 'security', 'privacy', 'community'],
    seoKeywords: ['source available budget app', 'transparent finance app', 'public source security'],
    seoDescription: msg`Learn why public source matters for financial software. How to audit apps yourself and how Budgie's transparent development protects your data.`,
    relatedArticleSlugs: ['budgie-offline-financial-data', 'local-first-movement-developers'],
    relatedFeatureSlugs: ['offline-first-expense-tracker', 'data-export', 'database-backup']
};

/* oxlint-enable lingui/no-unlocalized-strings */
