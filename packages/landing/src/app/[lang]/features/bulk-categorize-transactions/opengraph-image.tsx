/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Bulk Categorize Bank Transactions — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('bulk-categorize-transactions', i18n => ({
    title: t(i18n)`Bulk Categorize Transactions`,
    tagline: t(i18n)`Group by merchant. One tap per group.`,
    tags: [t(i18n)`bulk`, t(i18n)`merchants`, t(i18n)`on-device`]
}));
