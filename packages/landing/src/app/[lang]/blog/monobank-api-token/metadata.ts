import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'monobank-api-token',
    date: '2026-10-14',
    author: 'Budgie Team',
    readingTimeMinutes: 6,
    title: msg`Monobank API token: connect it in 2 minutes`,
    description: msg`Where to get your personal Monobank token, how to paste it into Budgie, how much history to load, and what to do when a sync stops.`,
    tags: ['monobank', 'bank-sync', 'how-to'],
    seoKeywords: [
        'токен monobank',
        'monobank api токен',
        'як підключити монобанк до трекера витрат',
        'monobank api token',
        'monobank expense tracker'
    ],
    seoDescription: msg`Get your personal Monobank API token, paste it into Budgie and choose how much history to load. Step by step, plus privacy and sync fixes.`,
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'mint-shutdown-private-alternative'],
    relatedFeatureSlugs: ['monobank-sync', 'mcc-auto-category', 'budget-planning']
};

/* oxlint-enable lingui/no-unlocalized-strings */
