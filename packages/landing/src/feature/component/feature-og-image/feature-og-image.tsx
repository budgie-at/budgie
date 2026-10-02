/* oxlint-disable lingui/no-unlocalized-strings */
import { ImageResponse } from 'next/og';

import { OgCard } from '../../../generic/component/og-card/og-card';
import { OG_IMAGE_SIZE } from '../../../generic/constant/og-image.constant';

const FEATURE_LABEL = 'Feature';

export const createFeatureOgImage = (title: string, tagline: string, tags: readonly string[], plate?: string): ImageResponse =>
    new ImageResponse(<OgCard label={FEATURE_LABEL} plate={plate} tagline={tagline} tags={tags} title={title} />, OG_IMAGE_SIZE);
