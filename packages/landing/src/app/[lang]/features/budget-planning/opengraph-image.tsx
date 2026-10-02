/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Monthly Budget Planning — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('budget-planning', i18n => ({
    title: t(i18n)`Budget Planning — One Limit, Split By Category`,
    tagline: t(
        i18n
    )`One overall limit, per-category limits, and a cap for everything else — with a home-screen widget and on-device alerts.`,
    tags: [t(i18n)`budget`, t(i18n)`limits`, t(i18n)`alerts`]
}));
