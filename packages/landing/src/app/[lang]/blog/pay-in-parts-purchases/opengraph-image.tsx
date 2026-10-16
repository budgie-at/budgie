/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/utils/create-blog-og-route.util';

export const alt = 'Pay in parts: track Monobank and PrivatBank plans';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('installment-tracking', i18n => ({
    title: t(i18n)`Pay in parts: track Monobank and PrivatBank plans`,
    tags: [t(i18n)`installments`, t(i18n)`monobank`, t(i18n)`how-to`]
}));
