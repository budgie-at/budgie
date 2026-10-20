import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'monobank-expense-tracking',
    date: '2026-10-14',
    author: 'Budgie Team',
    readingTimeMinutes: 7,
    title: msg`Track Monobank spending automatically`,
    description: msg`What happens after you connect Monobank: purchases arrive by themselves, get categories, transfers between your own cards merge and your budget fills in.`,
    tags: ['monobank', 'bank-sync', 'budgeting', 'how-to'],
    seoKeywords: [
        'облік витрат monobank',
        'автоматичний облік витрат монобанк',
        'трекер витрат для монобанку',
        'monobank expense tracker',
        'track monobank spending'
    ],
    seoDescription: msg`Connect Monobank once and Budgie does the rest: purchases arrive on their own, get categories from merchant codes, transfers merge, budgets fill in.`,
    relatedArticleSlugs: ['monobank-api-token', 'cloud-budgeting-privacy-risks'],
    relatedFeatureSlugs: ['monobank-sync', 'mcc-auto-category', 'budget-planning']
};

/* oxlint-enable lingui/no-unlocalized-strings */
