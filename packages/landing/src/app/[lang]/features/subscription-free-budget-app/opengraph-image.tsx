/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { resolveOgPlate } from '../../../../generic/util/resolve-og-plate.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Budget App No Subscription — 100% Free — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Subscription-Free Budget App — Completely Free`,
        t(i18n)`Recurring monthly fees turn budgeting into another bill. Budgie is completely free — every feature, no unlock, no tier.`,
        [t(i18n)`pricing`, t(i18n)`comparison`, t(i18n)`subscription-free`],
        resolveOgPlate('subscription-free-budget-app', lang)
    );
};

export default OgImage;
