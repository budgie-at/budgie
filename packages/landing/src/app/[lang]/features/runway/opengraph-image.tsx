/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { resolveOgPlate } from '../../../../generic/util/resolve-og-plate.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Runway: How Long Your Money Lasts — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Runway`,
        t(i18n)`How long your money lasts at today's pace.`,
        [t(i18n)`runway`, t(i18n)`forecast`, t(i18n)`burn rate`],
        resolveOgPlate('runway', lang)
    );
};

export default OgImage;
