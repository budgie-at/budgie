/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/utils/create-blog-og-route.util';

export const alt = 'After Mint: A Private, Offline Alternative That Actually Sticks Around';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('net-worth-tracker', i18n => ({
    title: t(i18n)`After Mint: A Private, Offline Alternative That Actually Sticks Around`,
    tags: [t(i18n)`mint-alternatives`, t(i18n)`offline-first`, t(i18n)`privacy`]
}));
