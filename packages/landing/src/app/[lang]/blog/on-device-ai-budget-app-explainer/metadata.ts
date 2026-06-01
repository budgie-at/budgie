import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'on-device-ai-budget-app-explainer',
    date: '2026-05-07',
    author: 'Budgie Team',
    image: '/images/design-mode/ai-budgeting-app-4x.jpg',
    readingTimeMinutes: 11,
    title: msg`On-Device AI in Your Budget App: How It Works and Why It Matters`,
    description: msg`Cloud AI assistants process your spending data on remote servers. On-device AI keeps every inference local. Here's how a 1.7B-param model, offline embeddings, and Whisper speech recognition work together in Budgie.`,
    tags: ['on-device-ai', 'privacy', 'local-llm', 'voice-input', 'ai-categorization'],
    seoKeywords: ['on-device AI budget app', 'private AI finance', 'local LLM finance app', 'offline AI expense tracker'],
    seoDescription: msg`Learn how on-device AI keeps your spending data private. Covers local LLM inference, offline embeddings, and Whisper speech-to-text — no cloud required.`,
    relatedArticleSlugs: ['offline-first-privacy-financial-app', 'budgie-offline-financial-data'],
    relatedFeatureSlugs: ['ai-auto-categorization', 'voice-transaction-entry', 'ai-transaction-suggestions', 'on-device-ai-budget-app']
};

/* eslint-enable lingui/no-unlocalized-strings */
