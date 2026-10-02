/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Smart Transfer Consolidation — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('transfer-pair-detection', i18n => ({
    title: t(i18n)`Transfer Consolidation`,
    tagline: t(i18n)`Two debits aren't a transfer. Budgie knows.`,
    tags: [t(i18n)`transfers`, t(i18n)`deduplication`, t(i18n)`smart`]
}));
