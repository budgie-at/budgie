/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Smart Expense Suggestions for Mobile — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('ai-transaction-suggestions', i18n => ({
    title: t(i18n)`Smart Transaction Suggestions — Tap and Done`,
    tagline: t(
        i18n
    )`Open the expense form and Budgie offers pill-shaped suggestions from your own history — category, tags, comment, amount, account, all pre-filled.`,
    tags: [t(i18n)`ai`, t(i18n)`suggestions`, t(i18n)`expense-tracking`]
}));
