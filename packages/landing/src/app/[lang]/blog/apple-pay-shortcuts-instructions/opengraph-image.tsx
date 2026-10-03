/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgImage } from '../../../../blog/component/blog-og-image/blog-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'How to Set Up Apple Pay Capture with Shortcuts';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createBlogOgImage(t(i18n)`How to Set Up Apple Pay Capture with Shortcuts`, [
        t(i18n)`Apple Pay`,
        t(i18n)`Shortcuts`,
        t(i18n)`offline-first`
    ]);
};

export default OgImage;
