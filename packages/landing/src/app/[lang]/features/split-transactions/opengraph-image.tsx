/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Split Transactions — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('split-transactions', i18n => ({
    title: t(i18n)`Split Transactions`,
    tagline: t(i18n)`One receipt, multiple categories.`,
    tags: [t(i18n)`split`, t(i18n)`categories`, t(i18n)`transactions`]
}));
