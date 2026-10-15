import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'pay-in-parts-purchases',
    date: '2026-10-14',
    author: 'Budgie Team',
    readingTimeMinutes: 7,
    title: msg`Pay in parts: track Monobank and PrivatBank plans`,
    description: msg`Turn a Monobank or PrivatBank pay-in-parts purchase into a plan in Budgie, see what is left to pay and keep your budget honest.`,
    tags: ['installments', 'monobank', 'privatbank', 'how-to'],
    seoKeywords: [
        'облік покупок частинами',
        'покупка частинами монобанк облік',
        'оплата частинами приватбанк як відстежувати',
        'pay in parts tracker',
        'installment purchase tracking app'
    ],
    seoDescription: msg`How to track Monobank and PrivatBank pay-in-parts purchases in Budgie: create a plan in a few taps and see every payment and what is still left.`,
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'historical-exchange-rates-budget-analytics'],
    relatedFeatureSlugs: ['installment-tracking', 'debt-tracking', 'budget-planning', 'transaction-long-press-menu']
};

/* oxlint-enable lingui/no-unlocalized-strings */
