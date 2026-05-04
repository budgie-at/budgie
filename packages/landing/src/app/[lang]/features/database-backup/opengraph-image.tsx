/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Database Backup & Restore — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(t(i18n)`Backup & Restore`, t(i18n)`Encrypted file. No account. No upload.`, [
        t(i18n)`backup`,
        t(i18n)`restore`,
        t(i18n)`encryption`
    ]);
};

export default OgImage;
