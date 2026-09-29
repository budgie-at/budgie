/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Balance Adjustment — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('balance-adjustment', i18n => ({
    title: t(i18n)`Balance Adjustment`,
    tagline: t(i18n)`Reconcile without fake income.`,
    tags: [t(i18n)`balance`, t(i18n)`reconcile`, t(i18n)`accounts`]
}));
