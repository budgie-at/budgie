/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/util/create-blog-og-route.util';

export const alt = 'Mint Shutdown: Where Developers Are Moving Their Finances';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('csv-import', i18n => ({
    title: t(i18n)`Mint Shutdown: Where Developers Are Moving Their Finances`,
    tags: [t(i18n)`mint alternatives`, t(i18n)`developer tools`, t(i18n)`privacy`]
}));
