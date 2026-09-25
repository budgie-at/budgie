/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { resolveOgPlate } from '../../../../generic/util/resolve-og-plate.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Bulk Categorize Bank Transactions — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Bulk Categorize Transactions`,
        t(i18n)`Group by merchant. One tap per group.`,
        [t(i18n)`bulk`, t(i18n)`merchants`, t(i18n)`on-device`],
        resolveOgPlate('uncategorized-transactions', lang)
    );
};

export default OgImage;
