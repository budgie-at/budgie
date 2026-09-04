/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Quick Edit Transaction App — Long-Press Menu — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Long-Press Quick Actions on Every Transaction`,
        t(i18n)`Long-press any transaction card to edit, delete, split, convert to transfer, or convert income to a refund — no full edit form required.`,
        [t(i18n)`ux`, t(i18n)`gestures`, t(i18n)`productivity`]
    );
};

export default OgImage;
