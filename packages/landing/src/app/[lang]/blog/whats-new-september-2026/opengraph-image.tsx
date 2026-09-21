/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgImage } from '../../../../blog/component/blog-og-image/blog-og-image';
import { resolveOgPlate } from '../../../../generic/util/resolve-og-plate.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = "What's New in Budgie: One Runway Verdict, Lighter On-Device AI, and Repaired Transfers";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createBlogOgImage(
        t(i18n)`What's New in Budgie: One Runway Verdict, Lighter On-Device AI, and Repaired Transfers`,
        [t(i18n)`runway`, t(i18n)`on-device-ai`, t(i18n)`changelog`],
        resolveOgPlate('home-hero', lang)
    );
};

export default OgImage;
