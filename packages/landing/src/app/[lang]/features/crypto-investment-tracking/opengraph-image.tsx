/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Crypto Portfolio Tracking — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('crypto-investment-tracking', i18n => ({
    title: t(i18n)`Crypto Portfolio`,
    tagline: t(i18n)`Two hundred crypto assets in one dashboard.`,
    tags: [t(i18n)`crypto`, t(i18n)`bitcoin`, t(i18n)`net worth`]
}));
