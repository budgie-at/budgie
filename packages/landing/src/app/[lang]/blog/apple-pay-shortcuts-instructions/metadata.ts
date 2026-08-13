import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'apple-pay-shortcuts-instructions',
    date: '2026-08-13',
    author: 'Budgie Team',
    image: '/images/apple-pay-shortcuts-instructions/apple-pay-capture-settings-screen.png',
    readingTimeMinutes: 6,
    title: msg`How to Set Up Apple Pay Capture with Shortcuts`,
    description: msg`A simple Apple Pay Shortcuts setup guide for Budgie, with a quick checklist, first-payment verification, troubleshooting, privacy notes, and platform limits.`,
    tags: ['apple-pay', 'shortcuts', 'ios', 'automation', 'expense-tracking'],
    seoKeywords: [
        'Apple Pay Shortcuts Budgie',
        'Apple Pay expense tracking shortcut',
        'Budgie Apple Pay capture setup',
        'iOS Shortcuts expense tracker'
    ],
    seoDescription: msg`Set up Budgie Apple Pay capture with iOS Shortcuts, verify the first payment, and understand privacy, troubleshooting, and Apple platform limitations.`,
    relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
    relatedFeatureSlugs: ['offline-first-expense-tracker', 'screenshot-protection']
};

/* oxlint-enable lingui/no-unlocalized-strings */
