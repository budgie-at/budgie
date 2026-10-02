/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Bank Fee Tracking — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('bank-fee-tracking', i18n => ({
    title: t(i18n)`Bank Fee Tracking`,
    tagline: t(i18n)`Keep ATM fees, transfer fees, and card commissions visible without polluting transfers.`,
    tags: [t(i18n)`fees`, t(i18n)`analytics`, t(i18n)`bank-sync`]
}));
