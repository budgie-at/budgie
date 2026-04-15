/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgImage } from '../../../../blog/component/blog-og-image/blog-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Best YNAB Alternatives for Privacy-Conscious Users (2025)';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createBlogOgImage(t(i18n)`Best YNAB Alternatives for Privacy-Conscious Users (2025)`, [
        t(i18n)`ynab`,
        t(i18n)`alternatives`,
        t(i18n)`privacy`
    ]);
};

export default OgImage;
