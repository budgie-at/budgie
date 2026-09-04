/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Bank Connection Management — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Bank Connections — One Credential, Many Accounts`,
        t(i18n)`Cards, jars, and deposits share a single connection, so a token change is a one-time job.`,
        [t(i18n)`bank sync`, t(i18n)`accounts`, t(i18n)`credentials`]
    );
};

export default OgImage;
