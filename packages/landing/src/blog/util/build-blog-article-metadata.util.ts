import { BASE_URL, OG_LOCALE_MAP, TITLE_TEMPLATE_SUFFIX } from '../../generic/constant/seo.constant';
import { buildAlternates } from '../../generic/util/build-alternates.util';
import { fitText } from '../../generic/util/fit-text.util';

import type { Metadata } from 'next';

const MAX_RENDERED_TITLE_CHARS = 60;
const MAX_DESCRIPTION_CHARS = 160;

interface BuildBlogArticleMetadataInput {
    locale: string;
    slug: string;
    title: string;
    description: string;
    keywords: string;
    date: string;
    author: string;
}

export const buildBlogArticleMetadata = ({
    locale,
    slug,
    title,
    description,
    keywords,
    date,
    author
}: BuildBlogArticleMetadataInput): Metadata => {
    const fittedTitle = fitText(title, MAX_RENDERED_TITLE_CHARS - TITLE_TEMPLATE_SUFFIX.length);
    const fittedDescription = fitText(description, MAX_DESCRIPTION_CHARS);

    return {
        title: fittedTitle,
        description: fittedDescription,
        keywords,
        authors: [{ name: author }],
        alternates: buildAlternates(locale, `/blog/${slug}`),
        openGraph: {
            title: fittedTitle,
            description: fittedDescription,
            type: 'article',
            url: `${BASE_URL}/${locale}/blog/${slug}`,
            locale: OG_LOCALE_MAP[locale] ?? 'en_US',
            publishedTime: date,
            authors: [author]
        },
        twitter: {
            card: 'summary_large_image',
            title: fittedTitle,
            description: fittedDescription,
            site: '@budgie_at',

            creator: '@budgie_at'
        }
    };
};
