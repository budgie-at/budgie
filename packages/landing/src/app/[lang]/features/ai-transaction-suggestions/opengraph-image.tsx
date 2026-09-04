/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Smart Expense Suggestions for Mobile — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Smart Transaction Suggestions — Tap and Done`,
        t(i18n)`Open the expense form and Budgie offers pill-shaped suggestions from your own history — category, tags, comment, amount, account, all pre-filled.`,
        [t(i18n)`ai`, t(i18n)`suggestions`, t(i18n)`expense-tracking`]
    );
};

export default OgImage;
