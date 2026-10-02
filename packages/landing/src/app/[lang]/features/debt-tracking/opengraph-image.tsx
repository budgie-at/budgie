/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Debt & Loan Tracking — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('debt-tracking', i18n => ({
    title: t(i18n)`Debt Tracking`,
    tagline: t(i18n)`Money out, money in — first class.`,
    tags: [t(i18n)`debt`, t(i18n)`loans`, t(i18n)`contacts`]
}));
