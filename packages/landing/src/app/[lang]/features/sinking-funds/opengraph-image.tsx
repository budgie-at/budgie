/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/utils/create-feature-og-route.util';

export const alt = 'Sinking Funds and Event Budgets — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('sinking-funds', i18n => ({
    title: t(i18n)`Sinking Funds and Event Budgets`,
    tagline: t(i18n)`Yearly bills and trips, planned ahead.`,
    tags: [t(i18n)`sinking funds`, t(i18n)`trip budget`, t(i18n)`auto-tune`]
}));
