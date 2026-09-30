/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'MCC Auto-Categorization — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('mcc-auto-category', i18n => ({
    title: t(i18n)`MCC Auto-Category`,
    tagline: t(i18n)`Bank-issued codes do the work.`,
    tags: [t(i18n)`mcc`, t(i18n)`categorization`, t(i18n)`bank sync`]
}));
