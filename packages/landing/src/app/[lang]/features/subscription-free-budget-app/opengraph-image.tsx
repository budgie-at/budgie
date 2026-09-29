/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Budget App No Subscription — 100% Free — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('subscription-free-budget-app', i18n => ({
    title: t(i18n)`Subscription-Free Budget App — Completely Free`,
    tagline: t(
        i18n
    )`Recurring monthly fees turn budgeting into another bill. Budgie is completely free — every feature, no unlock, no tier.`,
    tags: [t(i18n)`pricing`, t(i18n)`comparison`, t(i18n)`subscription-free`]
}));
