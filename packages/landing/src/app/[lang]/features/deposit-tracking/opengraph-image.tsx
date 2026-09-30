/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Deposit Tracking — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('deposit-tracking', i18n => ({
    title: t(i18n)`Deposit Tracking`,
    tagline: t(i18n)`Maturity date, payout, and close flow.`,
    tags: [t(i18n)`deposit`, t(i18n)`interest`, t(i18n)`maturity`]
}));
