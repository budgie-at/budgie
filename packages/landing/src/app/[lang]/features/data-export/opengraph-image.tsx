/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'CSV & Database Export — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('data-export', i18n => ({
    title: t(i18n)`Data Export`,
    tagline: t(i18n)`CSV for spreadsheets. Full database backup for restore.`,
    tags: [t(i18n)`export`, t(i18n)`csv`, t(i18n)`backup`]
}));
