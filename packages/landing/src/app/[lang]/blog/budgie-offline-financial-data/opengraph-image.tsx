/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/utils/create-blog-og-route.util';

export const alt = 'How Budgie Keeps Your Financial Data Off the Cloud';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('database-backup', i18n => ({
    title: t(i18n)`How Budgie Keeps Your Financial Data Off the Cloud`,
    tags: [t(i18n)`privacy`, t(i18n)`security`, t(i18n)`architecture`]
}));
