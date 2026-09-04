/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Budget App Without Bank Login — No Aggregator — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Budget App Without Bank Login — Direct API or Statement Import`,
        t(i18n)`Aggregators sit between you and your bank, mirroring every transaction to their servers. Budgie talks to your bank directly via tokens or imports statements you download yourself.`,
        [t(i18n)`privacy`, t(i18n)`aggregator`, t(i18n)`bank-sync`]
    );
};

export default OgImage;
