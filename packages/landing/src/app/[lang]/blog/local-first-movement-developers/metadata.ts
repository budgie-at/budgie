import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'local-first-movement-developers',
    date: '2025-01-29',
    author: 'Budgie Team',
    image: '/images/design-mode/ai-budgeting-app-4x.jpg',
    readingTimeMinutes: 18,
    title: msg`The Local-First Movement: Why Developers Are Building Offline Apps`,
    description: msg`Explore the local-first movement, CRDTs, sync engines, and why developers are choosing offline-first architecture for privacy-sensitive applications.`,
    tags: ['local-first', 'offline-first', 'CRDTs', 'sync-engines', 'software-architecture', 'privacy', 'developers'],
    seoKeywords: ['local-first software', 'CRDTs', 'offline-first architecture', 'sync engines'],
    seoDescription: msg`Explore the local-first movement: CRDTs, sync engines, real-world examples, and why developers are building offline-first apps for better privacy and performance.`,
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
    relatedFeatureSlugs: ['offline-first-expense-tracker', 'database-backup', 'data-export']
};

/* eslint-enable lingui/no-unlocalized-strings */
