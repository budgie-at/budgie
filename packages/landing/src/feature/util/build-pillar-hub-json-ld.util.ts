/* eslint-disable lingui/no-unlocalized-strings */
import { isNotEmptyArray } from '@rnw-community/shared';

import { BASE_URL } from '../../generic/constant/seo.constant';

interface BuildPillarHubJsonLdInput {
    readonly locale: string;
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly homeLabel: string;
    readonly faqs: readonly { readonly question: string; readonly answer: string }[];
    readonly publishedAt: string;
    readonly updatedAt: string;
}

export const buildPillarHubJsonLd = ({
    locale,
    slug,
    title,
    description,
    homeLabel,
    faqs,
    publishedAt,
    updatedAt
}: BuildPillarHubJsonLdInput): readonly [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>?] => {
    const url = `${BASE_URL}/${locale}/${slug}`;

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
        inLanguage: locale,
        isPartOf: { '@type': 'WebSite', name: 'Budgie', url: BASE_URL },
        breadcrumb: { '@id': `${url}#breadcrumb` }
    };

    if (!isNotEmptyArray(faqs)) {
        return [breadcrumbSchema, webPageSchema];
    }

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer }
        }))
    };

    return [breadcrumbSchema, webPageSchema, faqSchema];
};
