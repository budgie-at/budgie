/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Dark Mode — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('dark-mode', i18n => ({
    title: t(i18n)`Dark Mode`,
    tagline: t(i18n)`True black. OLED-friendly. No white flash.`,
    tags: [t(i18n)`dark mode`, t(i18n)`ui`, t(i18n)`theme`]
}));
