/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Offline-First Expense Tracker — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Offline-First Expense Tracker`,
        t(i18n)`Every transaction stays on your device. No cloud account, no leaks.`,
        [t(i18n)`offline-first`, t(i18n)`privacy`, t(i18n)`expense tracker`]
    );
};

export default OgImage;
