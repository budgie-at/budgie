import { ARTICLE_REGISTRY } from '../blog/constant/article-registry.constant';
import { FEATURE_REGISTRY } from '../feature/constant/feature-registry.constant';
import { FeatureTierEnum } from '../feature/constant/feature-tier.enum';
import { PILLAR_HUB_REGISTRY } from '../feature/constant/pillar-hub-registry.constant';
import { BASE_URL, LOCALES } from '../generic/constant/seo.constant';
import { SITEMAP_STATIC_LAST_MODIFIED } from '../generic/constant/sitemap-last-modified.constant';

import type { MetadataRoute } from 'next';

const staticPages = ['', '/blog', '/features'];

const buildSitemapLanguages = (path: string) => ({
    ...Object.fromEntries(LOCALES.map(locale => [locale, `${BASE_URL}/${locale}${path}`])),
    'x-default': `${BASE_URL}/en${path}`
});

const STATIC_PAGE_PRIORITY: Record<string, number> = {
    '': 1,
    '/features': 0.9,
    '/blog': 0.8
};

const FEATURE_TIER_PRIORITY: Record<string, number> = {
    [FeatureTierEnum.HERO]: 0.9,
    [FeatureTierEnum.CORE]: 0.8,
    [FeatureTierEnum.POWER]: 0.7,
    [FeatureTierEnum.NICHE]: 0.7
};

const sitemap = (): MetadataRoute.Sitemap => {
    const staticEntries = LOCALES.flatMap(locale =>
        staticPages.map(page => ({
            url: `${BASE_URL}/${locale}${page}`,
            lastModified: new Date(SITEMAP_STATIC_LAST_MODIFIED[page]),
            changeFrequency: page === '' ? ('weekly' as const) : ('monthly' as const),
            priority: STATIC_PAGE_PRIORITY[page],
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

    const featureEntries = LOCALES.flatMap(locale =>
        FEATURE_REGISTRY.map(entry => ({
            url: `${BASE_URL}/${locale}/features/${entry.slug}`,
            lastModified: new Date(entry.updatedAt),
            changeFrequency: 'monthly' as const,
            priority: FEATURE_TIER_PRIORITY[entry.tier],
            alternates: { languages: buildSitemapLanguages(`/features/${entry.slug}`) }
        }))
    );

    const pillarEntries = LOCALES.flatMap(locale =>
        PILLAR_HUB_REGISTRY.map(entry => ({
            url: `${BASE_URL}/${locale}/${entry.slug}`,
            lastModified: new Date(entry.updatedAt),
            changeFrequency: 'monthly' as const,
            priority: 0.85,
            alternates: { languages: buildSitemapLanguages(`/${entry.slug}`) }
        }))
    );

    return [...staticEntries, ...blogEntries, ...featureEntries, ...pillarEntries];
};

export default sitemap;
