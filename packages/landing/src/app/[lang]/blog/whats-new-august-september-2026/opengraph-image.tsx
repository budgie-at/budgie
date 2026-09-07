/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgImage } from '../../../../blog/component/blog-og-image/blog-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = "What's New in Budgie: Bank Integrations, Binance Sync, Deposits, and Debt";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createBlogOgImage(t(i18n)`What's New in Budgie: Bank Integrations, Binance Sync, Deposits, and Debt`, [
        t(i18n)`bank-sync`,
        t(i18n)`binance-sync`,
        t(i18n)`changelog`
    ]);
};

export default OgImage;
