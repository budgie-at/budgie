/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';
import { ImageResponse } from 'next/og';

import { OgCard } from '../../generic/component/og-card/og-card';
import { OG_IMAGE_SIZE } from '../../generic/constant/og-image.constant';
import { resolveOgPlate } from '../../generic/util/resolve-og-plate.util';
import { getI18nInstance } from '../../i18n/app-router-i18n';
import { PageLangParam } from '../../i18n/init-lingui';
import { SUPPORTED_LOCALES } from '../../i18n/supported-locales.constant.mjs';

export const alt = 'Budgie - Privacy-First Expense Tracker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const HOME_LABEL = 'Expense Tracker';
const HOME_PLATE_SLUG = 'home-hero';

// eslint-disable-next-line func-style
export async function generateStaticParams() {
    return SUPPORTED_LOCALES.map(lang => ({ lang }));
}

const OgImage = async ({ params }: PageLangParam) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);
    const tags = [t(i18n)`100% Offline`, t(i18n)`Encrypted`, t(i18n)`Open Source`];

    return new ImageResponse(
        <OgCard
            label={HOME_LABEL}
            plate={resolveOgPlate(HOME_PLATE_SLUG, lang)}
            tagline={t(i18n)`Track expenses, sync banks, manage crypto — all offline, encrypted, and on your device.`}
            tags={tags}
            title={t(i18n)`Privacy-First Expense Tracker`}
        />,
        OG_IMAGE_SIZE
    );
};

export default OgImage;
