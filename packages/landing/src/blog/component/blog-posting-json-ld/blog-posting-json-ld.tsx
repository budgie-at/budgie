/* eslint-disable lingui/no-unlocalized-strings */
import { isDefined } from '@rnw-community/shared';

import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { BASE_URL } from '../../../generic/constant/seo.constant';

interface Props {
    title: string;
    description: string;
    date: string;
    dateModified?: string;
    author: string;
    image?: string;
    locale: string;
    slug: string;
    keywords: string;
    homeLabel: string;
    blogLabel: string;
}

export const BlogPostingJsonLd = ({ title, description, date, dateModified, author, image, locale, slug, keywords, homeLabel, blogLabel }: Props) => {
    const articleUrl = `${BASE_URL}/${locale}/blog/${slug}`;
    const data = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description,
        datePublished: date,
        dateModified: dateModified ?? date,
        author: { '@type': 'Person', name: author },
        publisher: {
            '@type': 'Organization',
            name: 'Budgie',
            url: BASE_URL,
            logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo/black-on-white.svg` }
        },
        url: articleUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
        ...(isDefined(image) && { image: `${BASE_URL}${image}` }),
        keywords
    };

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': `${articleUrl}#breadcrumb`,
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: homeLabel, item: `${BASE_URL}/${locale}` },
            { '@type': 'ListItem', position: 2, name: blogLabel, item: `${BASE_URL}/${locale}/blog` },
            { '@type': 'ListItem', position: 3, name: title, item: articleUrl }
        ]
    };

    return (
        <>
            <JsonLd data={data} />
            <JsonLd data={breadcrumbSchema} />
        </>
    );
};
/* eslint-enable lingui/no-unlocalized-strings */
