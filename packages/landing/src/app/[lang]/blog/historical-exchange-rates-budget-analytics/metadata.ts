import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'historical-exchange-rates-budget-analytics',
    date: '2026-05-26',
    author: 'Budgie Team',
    image: '/images/design-mode/ai-budgeting-app-4x.jpg',
    readingTimeMinutes: 9,
    title: msg`Historical Exchange Rates in Budget Analytics`,
    description: msg`Why a multi-currency expense tracker needs transaction-date valuation, not today's exchange rate, and how Budgie keeps imported history comparable in your base currency.`,
    tags: ['multi-currency', 'exchange-rates', 'analytics', 'csv-import', 'bank-sync'],
    seoKeywords: [
        'historical exchange rates budget app',
        'multi currency expense tracker analytics',
        'transaction date exchange rate',
        'CSV import currency conversion'
    ],
    seoDescription: msg`Learn why budget analytics should value each transaction using the exchange rate from its real transaction date. Budgie stores base-currency values for accurate multi-currency history.`,
    relatedArticleSlugs: ['mint-alternatives-developers', 'offline-first-bank-data-safety'],
    relatedFeatureSlugs: ['multi-currency', 'spending-analytics', 'csv-import', 'monobank-sync']
};

/* eslint-enable lingui/no-unlocalized-strings */
