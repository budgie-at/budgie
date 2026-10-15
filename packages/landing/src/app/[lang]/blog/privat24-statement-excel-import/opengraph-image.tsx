/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/utils/create-blog-og-route.util';

export const alt = 'Privat24 Statement in Excel: Export and Import';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('privatbank-import', i18n => ({
    title: t(i18n)`Privat24 Statement in Excel: Export and Import`,
    tags: [t(i18n)`privat24`, t(i18n)`excel`, t(i18n)`import`]
}));
