/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Biometric Authentication — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('biometric-authentication', i18n => ({
    title: t(i18n)`Biometric Auth`,
    tagline: t(i18n)`Face ID drives the encryption key.`,
    tags: [t(i18n)`biometric`, t(i18n)`face id`, t(i18n)`security`]
}));
