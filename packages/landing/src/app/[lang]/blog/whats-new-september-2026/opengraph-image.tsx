/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/util/create-blog-og-route.util';

export const alt = "What's New in Budgie: One Runway Verdict, Lighter On-Device AI, and Repaired Transfers";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('home-hero', i18n => ({
    title: t(i18n)`What's New in Budgie: One Runway Verdict, Lighter On-Device AI, and Repaired Transfers`,
    tags: [t(i18n)`runway`, t(i18n)`on-device-ai`, t(i18n)`changelog`]
}));
