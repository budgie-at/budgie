/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Self-Hosted Budget App Mobile — No Server Needed — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Self-Hosted Finance App on Mobile — Without Running a Server`,
        t(i18n)`Self-hosting promises privacy but ships a server you have to babysit. Budgie gives you the same data ownership with zero ops — your phone is the server.`,
        [t(i18n)`self-hosted`, t(i18n)`privacy`, t(i18n)`no-server`]
    );
};

export default OgImage;
