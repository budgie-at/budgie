/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/utils/create-blog-og-route.util';

export const alt = 'Source-Available Budgeting: Why Transparency Matters for Your Money';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('open-source-budget-app-mobile', i18n => ({
    title: t(i18n)`Source-Available Budgeting: Why Transparency Matters for Your Money`,
    tags: [t(i18n)`source-available`, t(i18n)`transparency`, t(i18n)`budgeting`]
}));
