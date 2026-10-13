/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/util/create-blog-og-route.util';

export const alt = "What's New in Budgie: Bank Integrations, Binance Sync, Deposits, and Debt";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('binance-sync', i18n => ({
    title: t(i18n)`What's New in Budgie: Bank Integrations, Binance Sync, Deposits, and Debt`,
    tags: [t(i18n)`bank-sync`, t(i18n)`binance-sync`, t(i18n)`changelog`]
}));
