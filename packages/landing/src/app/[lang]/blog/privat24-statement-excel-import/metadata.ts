import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'privat24-statement-excel-import',
    date: '2026-10-14',
    author: 'Budgie Team',
    readingTimeMinutes: 6,
    title: msg`Privat24 Statement in Excel: Export and Import`,
    description: msg`How to export a Privat24 card statement to Excel and import it into Budgie: the steps in Privat24, what carries over, and how to add new operations later.`,
    tags: ['privatbank', 'privat24', 'excel', 'import', 'how-to'],
    seoKeywords: [
        'виписка приват24 excel',
        'як імпортувати виписку приват24',
        'як вивантажити виписку з приват24',
        'Privat24 statement Excel',
        'PrivatBank statement import'
    ],
    seoDescription: msg`Export a Privat24 card statement to Excel and import it into Budgie. Categories, amounts and currencies carry over, and repeats are skipped.`,
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'historical-exchange-rates-budget-analytics'],
    relatedFeatureSlugs: ['privatbank-import', 'csv-import', 'multi-currency']
};

/* oxlint-enable lingui/no-unlocalized-strings */
