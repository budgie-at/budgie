/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Multi-Currency Accounts — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('multi-currency', i18n => ({
    title: t(i18n)`Multi-Currency`,
    tagline: t(i18n)`Track in any currency. Sum in yours.`,
    tags: [t(i18n)`multi-currency`, t(i18n)`fx`, t(i18n)`accounts`]
}));
