/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Spending Analytics — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('spending-analytics', i18n => ({
    title: t(i18n)`Spending Analytics & Charts`,
    tagline: t(i18n)`Category, tag, trend — drill into anything.`,
    tags: [t(i18n)`analytics`, t(i18n)`charts`, t(i18n)`drill-down`]
}));
