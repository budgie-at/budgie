/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Date Filter Presets — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('date-filter-presets', i18n => ({
    title: t(i18n)`Date Filter Presets`,
    tagline: t(i18n)`Seven presets. Monday-to-Sunday weeks.`,
    tags: [t(i18n)`filters`, t(i18n)`dates`, t(i18n)`presets`]
}));
