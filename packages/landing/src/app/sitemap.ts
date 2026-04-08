import { getArticles } from '../blog/util/get-articles.util';

import type { MetadataRoute } from 'next';

const BASE_URL = 'https://budgie.app';
const LOCALES = ['en', 'uk', 'fr', 'de', 'es'];

const sitemap = (): MetadataRoute.Sitemap => {
    const articles = getArticles();
    const currentDate = new Date().toISOString();

    const staticPages = LOCALES.flatMap(locale => [
        {
            url: `${BASE_URL}/${locale}`,
            lastModified: currentDate,
            changeFrequency: 'weekly' as const,
            priority: 1.0
        },
        {
            url: `${BASE_URL}/${locale}/blog`,
            lastModified: currentDate,
            changeFrequency: 'weekly' as const,
            priority: 0.8
        },
        {
            url: `${BASE_URL}/${locale}/legal/privacy-policy`,
            lastModified: currentDate,
            changeFrequency: 'yearly' as const,
            priority: 0.3
        },
        {
            url: `${BASE_URL}/${locale}/legal/terms-of-service`,
            lastModified: currentDate,
            changeFrequency: 'yearly' as const,
            priority: 0.3
        },
        {
            url: `${BASE_URL}/${locale}/legal/license`,
            lastModified: currentDate,
            changeFrequency: 'yearly' as const,
            priority: 0.3
        }
    ]);

    const blogPages = articles.flatMap(article =>
        LOCALES.map(locale => ({
            url: `${BASE_URL}/${locale}/blog/${article.slug}`,
            lastModified: article.date,
            changeFrequency: 'monthly' as const,
            priority: 0.7
        }))
    );

    return [...staticPages, ...blogPages];
};

export default sitemap;
