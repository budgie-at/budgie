/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Multi-Account Money Management — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('account-management', i18n => ({
    title: t(i18n)`Multi-Account Management`,
    tagline: t(i18n)`Bank, cash, crypto — all on one screen.`,
    tags: [t(i18n)`accounts`, t(i18n)`management`, t(i18n)`multi-account`]
}));
