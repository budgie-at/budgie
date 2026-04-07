import { getArticles } from '../blog/util/get-articles.util';
import { BASE_URL, LOCALES } from '../generic/constant/seo.constant';

import type { MetadataRoute } from 'next';

const locales = [...LOCALES];

const staticPages = ['', '/blog', '/legal/privacy-policy', '/legal/terms-of-service', '/legal/license'];

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
    const articles = await getArticles('en');

    const staticEntries = locales.flatMap(locale =>
        staticPages.map(page => ({
            url: `${BASE_URL}/${locale}${page}`,
            lastModified: new Date(),
            changeFrequency: page === '' ? ('weekly' as const) : ('monthly' as const),
            priority: page === '' ? 1 : 0.8,
            alternates: {
                languages: {
                    ...Object.fromEntries(locales.map(altLocale => [altLocale, `${BASE_URL}/${altLocale}${page}`])),
                    'x-default': `${BASE_URL}/en${page}`
                }
            }
        }))
    );

    const blogEntries = locales.flatMap(locale =>
        articles.map(article => ({
            url: `${BASE_URL}/${locale}/blog/${article.slug}`,
            lastModified: new Date(article.date),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
            alternates: {
                languages: {
                    ...Object.fromEntries(locales.map(altLocale => [altLocale, `${BASE_URL}/${altLocale}/blog/${article.slug}`])),
                    'x-default': `${BASE_URL}/en/blog/${article.slug}`
                }
            }
        }))
    );

    return [...staticEntries, ...blogEntries];
};

export default sitemap;
