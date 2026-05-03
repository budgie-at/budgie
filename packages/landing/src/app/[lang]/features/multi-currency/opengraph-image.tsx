/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Multi-Currency Accounts — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(t(i18n)`Multi-Currency`, t(i18n)`Track in any currency. Sum in yours.`, [
        t(i18n)`multi-currency`,
        t(i18n)`fx`,
        t(i18n)`accounts`
    ]);
};

export default OgImage;
