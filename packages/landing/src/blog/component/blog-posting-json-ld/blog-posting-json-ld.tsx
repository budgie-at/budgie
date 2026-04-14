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
}

export const BlogPostingJsonLd = ({ title, description, date, dateModified, author, image, locale, slug, keywords }: Props) => {
    const url = `${BASE_URL}/${locale}/blog/${slug}`;
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
        url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        ...(isDefined(image) && { image: `${BASE_URL}${image}` }),
        keywords
    };

    return <JsonLd data={data} />;
};
/* eslint-enable lingui/no-unlocalized-strings */
