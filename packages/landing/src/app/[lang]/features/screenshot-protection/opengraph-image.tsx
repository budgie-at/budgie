/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Screenshot Protection — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('screenshot-protection', i18n => ({
    title: t(i18n)`Screenshot Protection`,
    tagline: t(i18n)`Accidental shares stay private.`,
    tags: [t(i18n)`privacy`, t(i18n)`screenshots`, t(i18n)`security`]
}));
