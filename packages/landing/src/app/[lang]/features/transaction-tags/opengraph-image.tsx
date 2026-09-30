/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Transaction Tags — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('transaction-tags', i18n => ({
    title: t(i18n)`Transaction Tags`,
    tagline: t(i18n)`Multi-dimensional tracking without spreadsheets.`,
    tags: [t(i18n)`tags`, t(i18n)`organization`, t(i18n)`analytics`]
}));
