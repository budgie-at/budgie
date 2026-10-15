import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'uah-eur-budget-ukrainians-in-eu',
    date: '2026-10-14',
    author: 'Budgie Team',
    readingTimeMinutes: 7,
    title: msg`UAH and EUR Accounts in One Budget App`,
    description: msg`A guide for Ukrainians living in the EU: keep your Monobank card, your EU bank account and cash in both currencies in one budget, with one net worth in the currency you choose.`,
    tags: ['multi-currency', 'monobank', 'erste-bank', 'net-worth', 'exchange-rates'],
    seoKeywords: [
        'UAH and EUR accounts in one app',
        'budget app for Ukrainians in the EU',
        'track expenses in hryvnia and euro',
        'Monobank and EU bank in one budget',
        'multi-currency budget abroad'
    ],
    seoDescription: msg`Track hryvnia and euro in one budget: Monobank syncs, EU bank statements import, cash in both currencies, one net worth in the currency you pick.`,
    relatedArticleSlugs: ['historical-exchange-rates-budget-analytics', 'offline-first-bank-data-safety'],
    relatedFeatureSlugs: ['multi-currency', 'monobank-sync', 'erste-bank-pdf-import', 'csv-import', 'net-worth-tracker']
};

/* oxlint-enable lingui/no-unlocalized-strings */
