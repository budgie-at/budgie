import { BASE_URL, DEFAULT_SOCIAL_IMAGE_PATH, OG_LOCALE_MAP } from '../../generic/constant/seo.constant';
import { buildAlternates } from '../../generic/util/build-alternates.util';

import type { Metadata } from 'next';

interface BuildPillarHubMetadataInput {
    readonly locale: string;
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly keywords: string;
    readonly image?: string;
    readonly publishedAt: string;
    readonly updatedAt: string;
}

export const buildPillarHubMetadata = ({
    locale,
    slug,
    title,
    description,
    keywords,
    image,
    publishedAt,
    updatedAt
}: BuildPillarHubMetadataInput): Metadata => {
    const socialImage = image ?? DEFAULT_SOCIAL_IMAGE_PATH;

    return {
        title,
        description,
        keywords,
        alternates: buildAlternates(locale, `/${slug}`),
        openGraph: {
            title,
            description,
            type: 'website',
            url: `${BASE_URL}/${locale}/${slug}`,
            locale: OG_LOCALE_MAP[locale] ?? 'en_US',
            images: [{ url: `${BASE_URL}${socialImage}`, width: 1200, height: 630 }]
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
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
