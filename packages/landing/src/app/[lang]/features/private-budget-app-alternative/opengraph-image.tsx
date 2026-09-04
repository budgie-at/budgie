/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Private Budget App — Cloud-Free Alternative — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Private Budget App — A Cloud-Free Alternative`,
        t(
            i18n
        )`Cloud-based personal finance apps mirror every transaction to their servers. Budgie keeps your ledger on your device. No account, no aggregator, no exposure.`,
        [t(i18n)`privacy`, t(i18n)`comparison`, t(i18n)`alternative`]
    );
};

export default OgImage;
