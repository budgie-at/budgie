/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Quick Edit Transaction App — Long-Press Menu — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('transaction-long-press-menu', i18n => ({
    title: t(i18n)`Long-Press Quick Actions on Every Transaction`,
    tagline: t(
        i18n
    )`Long-press any transaction card to edit, delete, split, convert to transfer, or convert income to a refund — no full edit form required.`,
    tags: [t(i18n)`ux`, t(i18n)`gestures`, t(i18n)`productivity`]
}));
