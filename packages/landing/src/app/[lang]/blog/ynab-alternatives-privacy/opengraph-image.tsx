/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/utils/create-blog-og-route.util';

export const alt = 'Best YNAB Alternatives for Privacy-Conscious Users (2025)';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('budget-planning', i18n => ({
    title: t(i18n)`Best YNAB Alternatives for Privacy-Conscious Users (2025)`,
    tags: [t(i18n)`ynab`, t(i18n)`alternatives`, t(i18n)`privacy`]
}));
