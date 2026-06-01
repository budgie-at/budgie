/* eslint-disable lingui/no-unlocalized-strings -- schema.org keys, not user-facing copy */
import { BASE_URL, OG_LOCALE_MAP } from '../../generic/constant/seo.constant';

interface BuildPillarHubJsonLdInput {
    readonly locale: string;
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly homeLabel: string;
    readonly publishedAt: string;
    readonly updatedAt: string;
}

export const buildPillarHubJsonLd = ({
    locale,
    slug,
    title,
    description,
    homeLabel,
    publishedAt,
    updatedAt
}: BuildPillarHubJsonLdInput): readonly [Record<string, unknown>, Record<string, unknown>] => {
    const url = `${BASE_URL}/${locale}/${slug}`;
    const languageTag = OG_LOCALE_MAP[locale].replace('_', '-');

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: homeLabel, item: `${BASE_URL}/${locale}` },
            { '@type': 'ListItem', position: 2, name: title, item: url }
        ]
    };

    const webPageSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description,
        url,
        datePublished: publishedAt,
        dateModified: updatedAt,
        inLanguage: languageTag,
        isPartOf: { '@type': 'WebSite', name: 'Budgie', url: BASE_URL },
        breadcrumb: { '@id': `${url}#breadcrumb` }
    };

    return [breadcrumbSchema, webPageSchema];
};
