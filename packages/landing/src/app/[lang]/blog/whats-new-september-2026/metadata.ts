import { msg } from '@lingui/core/macro';

import type { ArticleRegistryEntryInterface } from '../../../../blog/interface/article-registry-entry.interface';

/* oxlint-disable lingui/no-unlocalized-strings */

export const ARTICLE_METADATA: ArticleRegistryEntryInterface = {
    slug: 'whats-new-september-2026',
    date: '2026-09-16',
    author: 'Budgie Team',
    readingTimeMinutes: 7,
    title: msg`What's New in Budgie: One Runway Verdict, Lighter On-Device AI, and Repaired Transfers`,
    description: msg`A single Runway verdict replaces the old cash-flow widget, on-device AI comes back for existing installs with a real off switch and loads only while it's needed, and a batch of import and transfer fixes lands. Here is everything from the September 2026 cycle.`,
    tags: ['runway', 'on-device-ai', 'security', 'bank-sync', 'fixes'],
    seoKeywords: [
        'budgie changelog',
        'budgie new features',
        'runway cash flow app',
        'on-device ai budget app',
        'privatbank import budget app'
    ],
    seoDescription: msg`See what shipped in Budgie in September 2026: the Runway verdict and its Settings section, lighter on-device AI with a real off switch, fingerprint unlock, encrypted backup restore, own-card transfer repair, and smaller fixes.`,
    relatedArticleSlugs: ['whats-new-august-september-2026', 'on-device-ai-budget-app-explainer'],
    relatedFeatureSlugs: ['split-transactions', 'account-transfers', 'debt-tracking']
};

/* oxlint-enable lingui/no-unlocalized-strings */
