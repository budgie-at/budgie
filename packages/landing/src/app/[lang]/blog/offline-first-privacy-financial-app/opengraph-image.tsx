/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/utils/create-blog-og-route.util';

export const alt = 'Why Offline-First is the Only Way for Your Financial Privacy';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('screenshot-protection', i18n => ({
    title: t(i18n)`Why Offline-First is the Only Way for Your Financial Privacy`,
    tags: [t(i18n)`privacy`, t(i18n)`security`, t(i18n)`offline-first`]
}));
