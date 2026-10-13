/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/utils/create-blog-og-route.util';

export const alt = 'Historical Exchange Rates in Budget Analytics';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('multi-currency', i18n => ({
    title: t(i18n)`Historical Exchange Rates in Budget Analytics`,
    tags: [t(i18n)`multi-currency`, t(i18n)`exchange-rates`, t(i18n)`analytics`]
}));
