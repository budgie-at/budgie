/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Net Worth Tracker for Mobile — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('net-worth-tracker', i18n => ({
    title: t(i18n)`Net Worth Tracker`,
    tagline: t(i18n)`One number. Every account, every currency.`,
    tags: [t(i18n)`net worth`, t(i18n)`multi-currency`, t(i18n)`dashboard`]
}));
