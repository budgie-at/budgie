/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Sync Data Repairs — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('sync-data-repairs', i18n => ({
    title: t(i18n)`Sync Data Repairs`,
    tagline: t(i18n)`Remove duplicate bank imports.`,
    tags: [t(i18n)`sync`, t(i18n)`repair`, t(i18n)`duplicates`]
}));
