/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/utils/create-feature-og-route.util';

export const alt = 'Ask Siri About Your Budget — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('siri-budget-questions', i18n => ({
    title: t(i18n)`Ask Siri About Your Budget`,
    tagline: t(i18n)`Read-only answers, no app to open.`,
    tags: [t(i18n)`siri`, t(i18n)`read-only`, t(i18n)`PIN-safe`]
}));
