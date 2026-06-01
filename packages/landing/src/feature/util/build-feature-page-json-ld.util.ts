/* eslint-disable lingui/no-unlocalized-strings -- schema.org keys, not user-facing copy */
import { BASE_URL, OG_LOCALE_MAP } from '../../generic/constant/seo.constant';

interface BuildFeaturePageJsonLdInput {
    readonly locale: string;
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly featureName: string;
    readonly featuresLabel: string;
    readonly homeLabel: string;
    readonly publishedAt: string;
    readonly updatedAt: string;
}

export const buildFeaturePageJsonLd = ({
    locale,
    slug,
    title,
    description,
    featureName,
    featuresLabel,
    homeLabel,
    publishedAt,
    updatedAt
}: BuildFeaturePageJsonLdInput): readonly Record<string, unknown>[] => {
    const url = `${BASE_URL}/${locale}/features/${slug}`;
    const languageTag = OG_LOCALE_MAP[locale].replace('_', '-');

    const breadcrumbList = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: homeLabel, item: `${BASE_URL}/${locale}` },
            { '@type': 'ListItem', position: 2, name: featuresLabel, item: `${BASE_URL}/${locale}/features` },
            { '@type': 'ListItem', position: 3, name: featureName, item: url }
        ]
    };

    const webPage = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description,
        url,
        datePublished: publishedAt,
        dateModified: updatedAt,
        inLanguage: languageTag,
        isPartOf: { '@type': 'WebSite', name: 'Budgie', url: BASE_URL },
        breadcrumb: { '@id': `${url}#breadcrumb` },
        mainEntity: {
            '@type': 'SoftwareApplication',
            name: 'Budgie',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'iOS, Android',
            description,
            featureList: featureName,
            url: BASE_URL,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
        }
    };

    return [breadcrumbList, webPage];
};
