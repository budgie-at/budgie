/* oxlint-disable lingui/no-unlocalized-strings */
import { ImageResponse } from 'next/og';

import { OgCard } from '../../../generic/component/og-card/og-card';
import { OG_IMAGE_SIZE } from '../../../generic/constant/og-image.constant';

const BLOG_LABEL = 'Blog';

export const createBlogOgImage = (title: string, tags: readonly string[], plate?: string): ImageResponse =>
    new ImageResponse(<OgCard label={BLOG_LABEL} plate={plate} tags={tags} title={title} />, OG_IMAGE_SIZE);
