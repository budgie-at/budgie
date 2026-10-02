/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Binance Account Sync — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('binance-sync', i18n => ({
    title: t(i18n)`Binance Sync — Read-Only Keys, Real Balances`,
    tagline: t(i18n)`Spot, Funding, and Simple Earn balances plus P2P, trades, and rewards — signed with a read-only API key.`,
    tags: [t(i18n)`binance`, t(i18n)`crypto`, t(i18n)`sync`]
}));
