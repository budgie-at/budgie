/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/util/create-blog-og-route.util';

export const alt = 'The Local-First Movement: Why Developers Are Building Offline Apps';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('offline-first-expense-tracker', i18n => ({
    title: t(i18n)`The Local-First Movement: Why Developers Are Building Offline Apps`,
    tags: [t(i18n)`local-first`, t(i18n)`offline-first`, t(i18n)`CRDTs`]
}));
