/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'CSV Bank Statement Import — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('csv-import', i18n => ({
    title: t(i18n)`CSV Import`,
    tagline: t(i18n)`Any bank, any column order — map it or use a built-in preset.`,
    tags: [t(i18n)`csv`, t(i18n)`import`, t(i18n)`bank statement`]
}));
