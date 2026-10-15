/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/utils/create-blog-og-route.util';

export const alt = 'Import an Erste George PDF Statement into Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('erste-bank-pdf-import', i18n => ({
    title: t(i18n)`Import an Erste George PDF Statement into Budgie`,
    tags: [t(i18n)`erste`, t(i18n)`pdf`, t(i18n)`import`]
}));
