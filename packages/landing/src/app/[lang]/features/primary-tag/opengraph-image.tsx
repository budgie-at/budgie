/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Primary Tag — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('primary-tag', i18n => ({
    title: t(i18n)`Primary Tag`,
    tagline: t(i18n)`One badge. Scan a list at a glance.`,
    tags: [t(i18n)`tags`, t(i18n)`ui`, t(i18n)`scanning`]
}));
