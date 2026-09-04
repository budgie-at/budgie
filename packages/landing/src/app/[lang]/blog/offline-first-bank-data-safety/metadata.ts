import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'offline-first-bank-data-safety',
    date: '2026-05-07',
    author: 'Budgie Team',
    readingTimeMinutes: 10,
    title: msg`Bank Data Safety: Why Offline-First Is the Only Honest Answer`,
    description: msg`Financial aggregators centralise millions of bank credentials in one place — a magnet for attackers. Offline-first architecture eliminates the target. Here's how Budgie connects to banks without handing your credentials to a third party.`,
    tags: ['bank-data-safety', 'offline-first', 'privacy', 'plaid', 'aggregators', 'security'],
    seoKeywords: ['offline-first finance', 'bank data safety', 'Plaid alternative', 'no bank login budget app'],
    seoDescription: msg`Financial aggregators are high-value breach targets. Discover how offline-first architecture, direct bank APIs, and CSV/PDF imports keep your bank data safe without Plaid.`,
    relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'offline-first-privacy-financial-app'],
    relatedFeatureSlugs: ['offline-first-expense-tracker', 'monobank-sync', 'no-bank-login-budget-app']
};

/* oxlint-enable lingui/no-unlocalized-strings */
