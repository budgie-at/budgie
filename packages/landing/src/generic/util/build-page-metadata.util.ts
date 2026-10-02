import { isDefined } from '@rnw-community/shared';

import { BASE_URL, OG_LOCALE_MAP, TITLE_TEMPLATE_SUFFIX } from '../constant/seo.constant';

import { buildAlternates } from './build-alternates.util';
import { fitText } from './fit-text.util';

import type { PageMetadataInputInterface } from '../interface/page-metadata-input.interface';
import type { Metadata } from 'next';

const MAX_RENDERED_TITLE_CHARS = 60;
const MAX_DESCRIPTION_CHARS = 160;

export const buildPageMetadata = ({
    locale,
    path,
    title,
    description,
    keywords,
    publishedAt,
    updatedAt,
    author
}: PageMetadataInputInterface): Metadata => {
    const fittedTitle = fitText(title, MAX_RENDERED_TITLE_CHARS - TITLE_TEMPLATE_SUFFIX.length);
    const fittedDescription = fitText(description, MAX_DESCRIPTION_CHARS);
    const isArticle = isDefined(author);

    return {
        title: isArticle ? fittedTitle : { absolute: fittedTitle },
        description: fittedDescription,
        keywords,
        ...(isDefined(author) && { authors: [{ name: author }] }),
        alternates: buildAlternates(locale, path),
        openGraph: {
            title: fittedTitle,
            description: fittedDescription,
            type: isArticle ? 'article' : 'website',
            url: `${BASE_URL}/${locale}${path}`,
            locale: OG_LOCALE_MAP[locale] ?? 'en_US',
            ...(isDefined(author) && { publishedTime: publishedAt, authors: [author] })
        },
        twitter: {
            card: 'summary_large_image',
            title: fittedTitle,
            description: fittedDescription,
            site: '@budgie_at',
            creator: '@budgie_at'
        },
        ...(isDefined(updatedAt) && { other: { 'article:published_time': publishedAt, 'article:modified_time': updatedAt } })
    };
};
