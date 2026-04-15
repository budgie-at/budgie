import { ARTICLE_REGISTRY } from '../blog/constant/article-registry.constant';
import { BASE_URL, LOCALES } from '../generic/constant/seo.constant';

import type { MetadataRoute } from 'next';

const staticPages = ['', '/blog'];

const buildDate = new Date();

const buildSitemapLanguages = (path: string) => ({
    ...Object.fromEntries(LOCALES.map(locale => [locale, `${BASE_URL}/${locale}${path}`])),
    'x-default': `${BASE_URL}/en${path}`
});

const sitemap = (): MetadataRoute.Sitemap => {
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
        ARTICLE_REGISTRY.map(entry => ({
            url: `${BASE_URL}/${locale}/blog/${entry.slug}`,
            lastModified: new Date(entry.date),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
            alternates: { languages: buildSitemapLanguages(`/blog/${entry.slug}`) }
        }))
    );

    return [...staticEntries, ...blogEntries];
};

export default sitemap;
