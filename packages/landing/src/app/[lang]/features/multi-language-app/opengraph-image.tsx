/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Multi-Language App — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(t(i18n)`5 Languages`, t(i18n)`EN, UK, FR, DE, ES — full UI.`, [
        t(i18n)`i18n`,
        t(i18n)`languages`,
        t(i18n)`multilingual`
    ]);
};

export default OgImage;
