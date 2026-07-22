/* oxlint-disable lingui/no-unlocalized-strings */
import { BASE_URL } from '../generic/constant/seo.constant';

import type { MetadataRoute } from 'next';

const AI_CRAWLERS = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-User',
    'anthropic-ai',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot-Extended',
    'Amazonbot',
    'Meta-ExternalAgent',
    'CCBot'
];

const robots = (): MetadataRoute.Robots => ({
    rules: [
        {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/']
        },
        {
            userAgent: AI_CRAWLERS,
            allow: '/'
        }
    ],
    sitemap: `${BASE_URL}/sitemap.xml`
});

export default robots;
