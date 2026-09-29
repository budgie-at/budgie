/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Erste Bank PDF Import — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('erste-bank-pdf-import', i18n => ({
    title: t(i18n)`Erste Bank PDF Import`,
    tagline: t(i18n)`Classic and modern PDF formats supported.`,
    tags: [t(i18n)`erste`, t(i18n)`pdf`, t(i18n)`import`]
}));
