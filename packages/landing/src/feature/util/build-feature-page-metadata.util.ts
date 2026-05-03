import { isDefined } from '@rnw-community/shared';

import { BASE_URL, OG_LOCALE_MAP } from '../../generic/constant/seo.constant';
import { buildAlternates } from '../../generic/util/build-alternates.util';

import type { Metadata } from 'next';

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
}: BuildFeaturePageMetadataInput): Metadata => ({
    title,
    description,
    keywords,
    alternates: buildAlternates(locale, `/features/${slug}`),
    openGraph: {
        title,
        description,
        type: 'website',
        url: `${BASE_URL}/${locale}/features/${slug}`,
        locale: OG_LOCALE_MAP[locale] ?? 'en_US',
        ...(isDefined(image) && { images: [{ url: `${BASE_URL}${image}`, width: 1200, height: 630 }] })
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(isDefined(image) && { images: [`${BASE_URL}${image}`] }),
        site: '@budgie_at',
        creator: '@budgie_at'
    },
    other: {
        'article:published_time': publishedAt,
        'article:modified_time': updatedAt
    }
});
