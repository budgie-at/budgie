/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Uncategorized Transactions — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('uncategorized-transactions', i18n => ({
    title: t(i18n)`Uncategorized Transactions`,
    tagline: t(i18n)`Find missing categories before charts lie.`,
    tags: [t(i18n)`missing categories`, t(i18n)`analytics`, t(i18n)`cleanup`]
}));
