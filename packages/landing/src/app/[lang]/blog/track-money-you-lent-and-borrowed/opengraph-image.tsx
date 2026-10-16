/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/utils/create-blog-og-route.util';

export const alt = 'Who Owes Me? Track Money You Lent and Borrowed';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('debt-tracking', i18n => ({
    title: t(i18n)`Who Owes Me? Track Money You Lent and Borrowed`,
    tags: [t(i18n)`debts`, t(i18n)`lending`, t(i18n)`how-to`]
}));
