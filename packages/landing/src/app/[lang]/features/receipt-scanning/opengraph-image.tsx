/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/utils/create-feature-og-route.util';

export const alt = 'Receipt Scanning — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('receipt-scanning', i18n => ({
    title: t(i18n)`Receipt Scanning`,
    tagline: t(i18n)`Scan it. Confirm it. Read on your iPhone.`,
    tags: [t(i18n)`receipts`, t(i18n)`on device`, t(i18n)`iPhone`]
}));
