/* oxlint-disable lingui/no-unlocalized-strings */
import { createFeatureOgImage } from '../../../feature/component/feature-og-image/feature-og-image';
import { fitText } from '../../../generic/util/fit-text.util';
import { getI18nInstance } from '../../../i18n/app-router-i18n';

import { SECURITY_PILLAR_HUB_METADATA } from './metadata';

export const alt = 'Encrypted Budget App — Biometric Lock — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const MAX_OG_TAGLINE_CHARS = 140;

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        i18n._(SECURITY_PILLAR_HUB_METADATA.metaTitle),
        fitText(i18n._(SECURITY_PILLAR_HUB_METADATA.metaDescription), MAX_OG_TAGLINE_CHARS),
        SECURITY_PILLAR_HUB_METADATA.seoKeywords.slice(0, 3).map(keyword => i18n._(keyword))
    );
};

export default OgImage;
