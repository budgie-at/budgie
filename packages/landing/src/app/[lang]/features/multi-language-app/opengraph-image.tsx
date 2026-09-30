/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Multi-Language App — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('multi-language-app', i18n => ({
    title: t(i18n)`5 Languages`,
    tagline: t(i18n)`EN, UK, FR, DE, ES — full UI.`,
    tags: [t(i18n)`i18n`, t(i18n)`languages`, t(i18n)`multilingual`]
}));
