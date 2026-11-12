/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/utils/create-feature-og-route.util';

export const alt = 'Inzhur Fund Tracking — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('inzhur-fund-tracking', i18n => ({
    title: t(i18n)`Inzhur Fund Tracking`,
    tagline: t(i18n)`Holdings, value and return on what you paid.`,
    tags: [t(i18n)`Inzhur`, t(i18n)`funds`, t(i18n)`dividends`]
}));
