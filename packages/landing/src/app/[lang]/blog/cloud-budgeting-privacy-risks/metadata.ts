import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'cloud-budgeting-privacy-risks',
    date: '2025-01-27',
    author: 'Budgie Team',
    readingTimeMinutes: 16,
    title: msg`Why Cloud Budgeting Apps Are a Privacy Nightmare`,
    description: msg`A detailed technical analysis of how cloud-based budgeting apps collect, share, and expose your financial data through Plaid integrations, data breaches, and third-party aggregation.`,
    tags: ['privacy', 'security', 'cloud-security', 'data-breaches', 'plaid', 'financial-privacy', 'fintech'],
    seoKeywords: ['cloud budget app privacy', 'Plaid data risks', 'financial app data breaches'],
    seoDescription: msg`Technical analysis of privacy risks in cloud budgeting apps: Plaid data sharing, real data breaches, screen-scraping dangers, and how to evaluate financial app security.`,
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
    relatedFeatureSlugs: ['offline-first-expense-tracker', 'monobank-sync', 'screenshot-protection']
};

/* oxlint-enable lingui/no-unlocalized-strings */
