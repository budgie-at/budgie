/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/utils/create-feature-og-route.util';

export const alt = 'Family Sharing — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('family-sharing', i18n => ({
    title: t(i18n)`Family Sharing`,
    tagline: t(i18n)`Budget together. Keep the rest private.`,
    tags: [t(i18n)`family`, t(i18n)`partner`, t(i18n)`iCloud`]
}));
