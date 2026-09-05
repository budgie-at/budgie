/* oxlint-disable lingui/no-unlocalized-strings */
import { createFeatureOgImage } from '../../../feature/component/feature-og-image/feature-og-image';
import { fitText } from '../../../generic/util/fit-text.util';
import { getI18nInstance } from '../../../i18n/app-router-i18n';

import { PRIVACY_PILLAR_HUB_METADATA } from './metadata';

export const alt = 'Private Expense Tracker — On-Device — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const MAX_OG_TAGLINE_CHARS = 140;

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        i18n._(PRIVACY_PILLAR_HUB_METADATA.metaTitle),
        fitText(i18n._(PRIVACY_PILLAR_HUB_METADATA.metaDescription), MAX_OG_TAGLINE_CHARS),
        PRIVACY_PILLAR_HUB_METADATA.seoKeywords.slice(0, 3).map(keyword => i18n._(keyword))
    );
};

export default OgImage;
