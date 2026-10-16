/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/utils/create-blog-og-route.util';

export const alt = 'Track Monobank spending automatically';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('monobank-sync', i18n => ({
    title: t(i18n)`Track Monobank spending automatically`,
    tags: [t(i18n)`monobank`, t(i18n)`budgeting`, t(i18n)`how-to`]
}));
