/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Monobank Auto-Sync — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('monobank-sync', i18n => ({
    title: t(i18n)`Monobank Bank Sync`,
    tagline: t(i18n)`Direct API. No aggregator. Yours forever.`,
    tags: [t(i18n)`monobank`, t(i18n)`privacy`, t(i18n)`bank sync`]
}));
