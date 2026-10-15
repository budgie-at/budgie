/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/utils/create-blog-og-route.util';

export const alt = 'UAH and EUR Accounts in One Budget App';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('multi-currency', i18n => ({
    title: t(i18n)`UAH and EUR Accounts in One Budget App`,
    tags: [t(i18n)`multi-currency`, t(i18n)`Monobank`, t(i18n)`net worth`]
}));
