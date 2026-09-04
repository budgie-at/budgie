import { BASE_URL, DEFAULT_SOCIAL_IMAGE_PATH, OG_LOCALE_MAP, TITLE_TEMPLATE_SUFFIX } from '../../generic/constant/seo.constant';
import { buildAlternates } from '../../generic/util/build-alternates.util';
import { fitText } from '../../generic/util/fit-text.util';

import type { Metadata } from 'next';

const MAX_RENDERED_TITLE_CHARS = 60;
const MAX_DESCRIPTION_CHARS = 160;

interface BuildFeaturePageMetadataInput {
    readonly locale: string;
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly keywords: string;
    readonly image?: string;
    readonly publishedAt: string;
    readonly updatedAt: string;
}

export const buildFeaturePageMetadata = ({
    locale,
    slug,
    title,
    description,
    keywords,
    image,
    publishedAt,
    updatedAt
}: BuildFeaturePageMetadataInput): Metadata => {
    const fittedTitle = fitText(title, MAX_RENDERED_TITLE_CHARS - TITLE_TEMPLATE_SUFFIX.length);
    const fittedDescription = fitText(description, MAX_DESCRIPTION_CHARS);
    const socialImage = image ?? DEFAULT_SOCIAL_IMAGE_PATH;

    return {
        title: { absolute: fittedTitle },
        description: fittedDescription,
        keywords,
        alternates: buildAlternates(locale, `/features/${slug}`),
        openGraph: {
            title: fittedTitle,
            description: fittedDescription,
            type: 'website',
            url: `${BASE_URL}/${locale}/features/${slug}`,
            locale: OG_LOCALE_MAP[locale] ?? 'en_US',
            images: [{ url: `${BASE_URL}${socialImage}`, width: 1200, height: 630 }]
        },
        twitter: {
            card: 'summary_large_image',
            title: fittedTitle,
            description: fittedDescription,
            images: [`${BASE_URL}${socialImage}`],
            site: '@budgie_at',
            creator: '@budgie_at'
        },
        other: {
            'article:published_time': publishedAt,
            'article:modified_time': updatedAt
        }
    };
};
