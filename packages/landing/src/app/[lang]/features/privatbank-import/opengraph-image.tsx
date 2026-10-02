/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'PrivatBank XLSX Import — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('privatbank-import', i18n => ({
    title: t(i18n)`PrivatBank Import`,
    tagline: t(i18n)`XLSX, MCC-mapped, two taps.`,
    tags: [t(i18n)`privatbank`, t(i18n)`xlsx`, t(i18n)`import`]
}));
