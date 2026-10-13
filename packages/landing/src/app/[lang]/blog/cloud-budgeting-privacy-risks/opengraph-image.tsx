/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/util/create-blog-og-route.util';

export const alt = 'Why Cloud Budgeting Apps Are a Privacy Nightmare';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('no-bank-login-budget-app', i18n => ({
    title: t(i18n)`Why Cloud Budgeting Apps Are a Privacy Nightmare`,
    tags: [t(i18n)`privacy`, t(i18n)`security`, t(i18n)`cloud risks`]
}));
