/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Convert Income to Refund in Expense App — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Convert Income to Refund`,
        t(i18n)`Link refund income back to the expense it reverses — full or partial, automatic or manual, always reversible.`,
        [t(i18n)`refunds`, t(i18n)`analytics`, t(i18n)`cleanup`]
    );
};

export default OgImage;
