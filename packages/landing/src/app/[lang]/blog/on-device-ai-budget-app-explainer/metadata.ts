import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'on-device-ai-budget-app-explainer',
    date: '2026-05-07',
    author: 'Budgie Team',
    readingTimeMinutes: 11,
    title: msg`On-Device AI in Your Budget App: How It Works and Why It Matters`,
    description: msg`Cloud AI assistants process your spending data on remote servers. Budgie's AI runs on your phone. Here's what that means for your privacy, your storage, your battery, and what the AI can and cannot do.`,
    tags: ['on-device-ai', 'privacy', 'offline', 'voice-input', 'ai-categorization'],
    seoKeywords: ['on-device AI budget app', 'private AI finance', 'offline AI finance app', 'offline AI expense tracker'],
    seoDescription: msg`How AI that runs on your phone keeps spending data private: what stays local, what it costs in storage and battery, and what it can and cannot do.`,
    relatedArticleSlugs: ['offline-first-privacy-financial-app', 'budgie-offline-financial-data'],
    relatedFeatureSlugs: ['ai-auto-categorization', 'voice-transaction-entry', 'ai-transaction-suggestions', 'on-device-ai-budget-app']
};

/* oxlint-enable lingui/no-unlocalized-strings */
