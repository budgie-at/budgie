/* eslint-disable lingui/no-unlocalized-strings */
import { isDefined } from '@rnw-community/shared';

import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { BASE_URL } from '../../../generic/constant/seo.constant';

interface Props {
    title: string;
    description: string;
    date: string;
    author: string;
    image?: string;
    locale: string;
    slug: string;
    keywords: string;
}

export const BlogPostingJsonLd = ({ title, description, date, author, image, locale, slug, keywords }: Props) => {
    const data = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description,
        datePublished: date,
        author: { '@type': 'Person', name: author },
        publisher: { '@type': 'Organization', name: 'Budgie', url: BASE_URL },
        url: `${BASE_URL}/${locale}/blog/${slug}`,
        ...(isDefined(image) && { image: `${BASE_URL}${image}` }),
        keywords
    };

    return <JsonLd data={data} />;
};
/* eslint-enable lingui/no-unlocalized-strings */
