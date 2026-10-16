/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/utils/create-blog-og-route.util';

export const alt = 'Monobank API token: connect it in 2 minutes';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('no-bank-login-budget-app', i18n => ({
    title: t(i18n)`Monobank API token: connect it in 2 minutes`,
    tags: [t(i18n)`monobank`, t(i18n)`bank sync`, t(i18n)`how-to`]
}));
