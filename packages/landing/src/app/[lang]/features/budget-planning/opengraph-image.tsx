/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Monthly Budget Planning — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Budget Planning — Limits That Match Your Payday`,
        t(i18n)`One overall limit, per-category limits, and a cap for everything else — with a home-screen widget and on-device alerts.`,
        [t(i18n)`budget`, t(i18n)`limits`, t(i18n)`alerts`]
    );
};

export default OgImage;
