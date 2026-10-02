/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Automatic Expense Tags — On-Device — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('ai-tag-suggestions', i18n => ({
    title: t(i18n)`Automatic Tag Suggestions — Tap, Don't Type`,
    tagline: t(i18n)`After picking a category, Budgie proposes up to three tags as tappable pills — instantly, and entirely on your phone.`,
    tags: [t(i18n)`ai`, t(i18n)`tags`, t(i18n)`suggestions`]
}));
