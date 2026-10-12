/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/util/create-blog-og-route.util';

export const alt = 'Bank Data Safety: Why Offline-First Is the Only Honest Answer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('monobank-sync', i18n => ({
    title: t(i18n)`Bank Data Safety: Why Offline-First Is the Only Honest Answer`,
    tags: [t(i18n)`bank-data-safety`, t(i18n)`offline-first`, t(i18n)`privacy`]
}));
