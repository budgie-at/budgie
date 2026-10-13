/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Pay in Parts: Installment Tracking — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('installment-tracking', i18n => ({
    title: t(i18n)`Pay in Parts`,
    tagline: t(i18n)`What you still owe, and when the next part is due.`,
    tags: [t(i18n)`installments`, t(i18n)`pay in parts`, t(i18n)`debt`]
}));
