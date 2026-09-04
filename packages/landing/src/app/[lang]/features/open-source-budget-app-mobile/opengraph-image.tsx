/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Source-Available Mobile Budget App — Auditable Privacy — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Source-Available Budget App for Mobile — Audit, Fork, Trust`,
        t(
            i18n
        )`Closed-source finance apps ask you to trust marketing. Budgie's mobile app has public source, so the privacy and security claims are auditable line by line.`,
        [t(i18n)`open-source`, t(i18n)`transparency`, t(i18n)`github`]
    );
};

export default OgImage;
