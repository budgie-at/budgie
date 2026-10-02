/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Transaction Categorization Rules — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('categorization-rules', i18n => ({
    title: t(i18n)`Categorization Rules — Deterministic, Not Guesswork`,
    tagline: t(i18n)`If the title contains this and the MCC is that, set the category, add the tag, or make it a transfer.`,
    tags: [t(i18n)`rules`, t(i18n)`categorization`, t(i18n)`automation`]
}));
