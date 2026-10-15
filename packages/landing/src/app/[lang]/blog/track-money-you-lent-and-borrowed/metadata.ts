import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'track-money-you-lent-and-borrowed',
    date: '2026-10-14',
    author: 'Budgie Team',
    readingTimeMinutes: 6,
    title: msg`Who Owes Me? Track Money You Lent and Borrowed`,
    description: msg`A step-by-step guide to tracking money you lent to friends and money you borrowed: open a debt, attach repayments as they arrive, and see what is still owed on both sides.`,
    tags: ['debts', 'lending', 'how-to'],
    seoKeywords: [
        'who owes me app',
        'track money lent to friends',
        'debt tracker app',
        'облік боргів',
        'як вести облік боргів',
        'додаток для обліку боргів'
    ],
    seoDescription: msg`How to track money you lent to friends and money you borrowed: open a debt, attach repayments, and see who still owes whom at a glance.`,
    relatedArticleSlugs: ['whats-new-september-2026'],
    relatedFeatureSlugs: ['debt-tracking', 'installment-tracking', 'account-management']
};

/* oxlint-enable lingui/no-unlocalized-strings */
