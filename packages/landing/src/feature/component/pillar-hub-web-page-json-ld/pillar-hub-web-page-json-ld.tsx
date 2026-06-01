/* eslint-disable lingui/no-unlocalized-strings -- schema.org keys, not user-facing copy */
import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { BASE_URL, OG_LOCALE_MAP } from '../../../generic/constant/seo.constant';

interface Props {
    readonly description: string;
    readonly locale: string;
    readonly publishedAt: string;
    readonly slug: string;
    readonly title: string;
    readonly updatedAt: string;
}

export const PillarHubWebPageJsonLd = ({ description, locale, publishedAt, slug, title, updatedAt }: Props) => {
    const url = `${BASE_URL}/${locale}/${slug}`;
    const languageTag = OG_LOCALE_MAP[locale].replace('_', '-');
    const data = {
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

    return <JsonLd data={data} />;
};
