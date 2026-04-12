import { isDefined } from '@rnw-community/shared';

import { BASE_URL, OG_LOCALE_MAP } from '../../generic/constant/seo.constant';
import { buildAlternates } from '../../generic/util/build-alternates.util';

import type { Metadata } from 'next';

interface BuildBlogArticleMetadataInput {
    locale: string;
    slug: string;
    title: string;
    description: string;
    keywords: string;
    image?: string;
    date: string;
    author: string;
}

export const buildBlogArticleMetadata = ({
    locale,
    slug,
    title,
    description,
    keywords,
    image,
    date,
    author
}: BuildBlogArticleMetadataInput): Metadata => ({
    title,
    description,
    keywords,
    authors: [{ name: author }],
    alternates: buildAlternates(locale, `/blog/${slug}`),
    openGraph: {
        title,
        description,
        type: 'article',
        url: `${BASE_URL}/${locale}/blog/${slug}`,
        locale: OG_LOCALE_MAP[locale] ?? 'en_US',
        publishedTime: date,
        authors: [author],
        ...(isDefined(image) && { images: [{ url: `${BASE_URL}${image}`, width: 1280, height: 720 }] })
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(isDefined(image) && { images: [`${BASE_URL}${image}`] })
    }
});
