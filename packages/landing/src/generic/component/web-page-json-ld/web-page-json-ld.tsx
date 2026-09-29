/* oxlint-disable lingui/no-unlocalized-strings -- schema.org keys, not user-facing copy */
import { isDefined } from '@rnw-community/shared';

import { BASE_URL, OG_LOCALE_MAP } from '../../constant/seo.constant';
import { JsonLd } from '../json-ld/json-ld';

interface Props {
    readonly description: string;
    readonly featureName?: string;
    readonly locale: string;
    readonly publishedAt: string;
    readonly path: string;
    readonly title: string;
    readonly updatedAt: string;
}

export const WebPageJsonLd = ({ description, featureName, locale, path, publishedAt, title, updatedAt }: Props) => {
    const url = `${BASE_URL}/${locale}${path}`;
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
        breadcrumb: { '@id': `${url}#breadcrumb` },
        ...(isDefined(featureName) && {
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
        })
    };

    return <JsonLd data={data} />;
};
