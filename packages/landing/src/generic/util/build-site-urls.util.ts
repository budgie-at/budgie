import { ARTICLE_REGISTRY } from '../../blog/constant/article-registry.constant';
import { FEATURE_REGISTRY } from '../../feature/constant/feature-registry.constant';
import { PILLAR_HUB_REGISTRY } from '../../feature/constant/pillar-hub-registry.constant';
import { BASE_URL, LOCALES } from '../constant/seo.constant';

const STATIC_PATHS = ['', '/blog', '/features'];

export const buildSiteUrls = (): readonly string[] =>
    LOCALES.flatMap(locale => [
        ...STATIC_PATHS.map(path => `${BASE_URL}/${locale}${path}`),
        ...ARTICLE_REGISTRY.map(entry => `${BASE_URL}/${locale}/blog/${entry.slug}`),
        ...FEATURE_REGISTRY.map(entry => `${BASE_URL}/${locale}/features/${entry.slug}`),
        ...PILLAR_HUB_REGISTRY.map(entry => `${BASE_URL}/${locale}/${entry.slug}`)
    ]);
