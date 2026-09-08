import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'whats-new-august-september-2026',
    date: '2026-09-07',
    author: 'Budgie Team',
    readingTimeMinutes: 8,
    title: msg`What's New in Budgie: Bank Integrations, Binance Sync, Deposits, and Debt`,
    description: msg`Bank connections became a first-class object, Binance sync shipped, deposit and debt got dedicated account types, and the app got measurably faster to open. Here is everything that shipped between August and September 2026.`,
    tags: ['bank-sync', 'binance-sync', 'deposit-tracking', 'debt-tracking', 'performance'],
    seoKeywords: [
        'budgie changelog',
        'budgie new features',
        'bank integration budget app',
        'binance sync budget app',
        'deposit tracking app update'
    ],
    seoDescription: msg`See what shipped in Budgie between August and September 2026: bank integration settings, Binance sync, deposit and debt account types, amount-range filtering, consolidation accuracy fixes, and startup performance work.`,
    relatedArticleSlugs: ['on-device-ai-budget-app-explainer', 'offline-first-bank-data-safety'],
    relatedFeatureSlugs: ['bank-integration-management', 'binance-sync', 'deposit-tracking', 'debt-tracking']
};

/* oxlint-enable lingui/no-unlocalized-strings */
