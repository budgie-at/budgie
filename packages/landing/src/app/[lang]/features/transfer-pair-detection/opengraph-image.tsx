/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Smart Transfer Consolidation — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(t(i18n)`Transfer Consolidation`, t(i18n)`Two debits aren't a transfer. Budgie knows.`, [
        t(i18n)`transfers`,
        t(i18n)`deduplication`,
        t(i18n)`smart`
    ]);
};

export default OgImage;
