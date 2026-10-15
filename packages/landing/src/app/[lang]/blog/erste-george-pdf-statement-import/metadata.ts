import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'erste-george-pdf-statement-import',
    date: '2026-10-14',
    author: 'Budgie Team',
    readingTimeMinutes: 6,
    title: msg`Import an Erste George PDF Statement into Budgie`,
    description: msg`How to download an Erste Bank statement as a PDF in George and import it into Budgie: the steps in George, what carries over, and how to add new statements later.`,
    tags: ['erste', 'george', 'pdf', 'import', 'how-to'],
    seoKeywords: [
        'George Kontoauszug importieren',
        'Erste Bank Kontoauszug PDF Haushaltsbuch',
        'Haushaltsbuch App Kontoauszug importieren Österreich',
        'Erste George statement import',
        'Erste Bank PDF statement budget app'
    ],
    seoDescription: msg`Download your Erste Bank statement as a PDF in George and import it into Budgie. Bookings and the IBAN carry over, and repeats are skipped.`,
    relatedArticleSlugs: ['offline-first-bank-data-safety', 'budgie-offline-financial-data'],
    relatedFeatureSlugs: ['erste-bank-pdf-import', 'csv-import', 'multi-currency']
};

/* oxlint-enable lingui/no-unlocalized-strings */
