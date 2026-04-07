import { getArticles } from '../blog/util/get-articles.util';
import { BASE_URL, LOCALES } from '../generic/constant/seo.constant';

import type { MetadataRoute } from 'next';

const staticPages = ['', '/blog', '/legal/privacy-policy', '/legal/terms-of-service', '/legal/license'];

const buildDate = new Date();

const buildSitemapLanguages = (path: string) => ({
    ...Object.fromEntries(LOCALES.map(locale => [locale, `${BASE_URL}/${locale}${path}`])),
    'x-default': `${BASE_URL}/en${path}`
});

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
    const articles = await getArticles('en');

    const staticEntries = LOCALES.flatMap(locale =>
        staticPages.map(page => ({
            url: `${BASE_URL}/${locale}${page}`,
            lastModified: buildDate,
            changeFrequency: page === '' ? ('weekly' as const) : ('monthly' as const),
            priority: page === '' ? 1 : 0.8,
            alternates: { languages: buildSitemapLanguages(page) }
        }))
    );

    const blogEntries = LOCALES.flatMap(locale =>
        articles.map(article => ({
            url: `${BASE_URL}/${locale}/blog/${article.slug}`,
            lastModified: new Date(article.date),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
            alternates: { languages: buildSitemapLanguages(`/blog/${article.slug}`) }
        }))
    );

    return [...staticEntries, ...blogEntries];
};

export default sitemap;
