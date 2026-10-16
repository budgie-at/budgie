/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../blog/utils/create-blog-og-route.util';

export const alt = "Budgie Changelog: What's New in the App";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('home-hero', i18n => ({
    title: t(i18n)`Budgie Changelog: What's New in the App`,
    tags: [t(i18n)`changelog`, t(i18n)`runway`, t(i18n)`on-device-ai`]
}));
