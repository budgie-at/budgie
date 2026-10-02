/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Recurring Payments Calendar — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('recurring-payments-calendar', i18n => ({
    title: t(i18n)`Recurring Calendar`,
    tagline: t(i18n)`Spot the slow leak before it bills.`,
    tags: [t(i18n)`recurring`, t(i18n)`subscriptions`, t(i18n)`calendar`]
}));
