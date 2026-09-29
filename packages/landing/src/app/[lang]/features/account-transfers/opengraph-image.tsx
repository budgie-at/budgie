/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Account Transfers — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('account-transfers', i18n => ({
    title: t(i18n)`Account Transfers`,
    tagline: t(i18n)`Cross-currency, dual-amount, exact.`,
    tags: [t(i18n)`transfers`, t(i18n)`multi-currency`, t(i18n)`accounts`]
}));
