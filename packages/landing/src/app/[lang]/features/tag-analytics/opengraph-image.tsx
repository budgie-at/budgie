/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Tag-Based Analytics — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('tag-analytics', i18n => ({
    title: t(i18n)`Tag Analytics`,
    tagline: t(i18n)`#vacation, #shared, #reimbursable — quantified.`,
    tags: [t(i18n)`tags`, t(i18n)`analytics`, t(i18n)`drill-down`]
}));
