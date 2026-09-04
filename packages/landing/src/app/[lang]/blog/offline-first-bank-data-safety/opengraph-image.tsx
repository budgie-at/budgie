/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgImage } from '../../../../blog/component/blog-og-image/blog-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Bank Data Safety: Why Offline-First Is the Only Honest Answer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createBlogOgImage(t(i18n)`Bank Data Safety: Why Offline-First Is the Only Honest Answer`, [
        t(i18n)`bank-data-safety`,
        t(i18n)`offline-first`,
        t(i18n)`privacy`
    ]);
};

export default OgImage;
