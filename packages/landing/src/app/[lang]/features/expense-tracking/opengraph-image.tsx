/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/utils/create-feature-og-route.util';

export const alt = 'Expense Tracking App, Log in Seconds — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('expense-tracking', i18n => ({
    title: t(i18n)`Expense Tracking`,
    tagline: t(i18n)`Two taps from open to saved.`,
    tags: [t(i18n)`expense tracking`, t(i18n)`transactions`, t(i18n)`mobile`]
}));
