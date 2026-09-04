/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Budget App No Subscription — Free Core, One-Time Pro — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Subscription-Free Budget App — Pay Once or Free`,
        t(
            i18n
        )`Recurring monthly fees turn budgeting into another bill. Budgie's core is free; advanced features unlock with a one-time purchase you actually own.`,
        [t(i18n)`pricing`, t(i18n)`comparison`, t(i18n)`subscription-free`]
    );
};

export default OgImage;
