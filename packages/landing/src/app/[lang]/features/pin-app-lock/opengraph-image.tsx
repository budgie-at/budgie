/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/utils/create-feature-og-route.util';

export const alt = 'PIN App Lock — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('pin-app-lock', i18n => ({
    title: t(i18n)`PIN App Lock`,
    tagline: t(i18n)`One PIN. A growing wait.`,
    tags: [t(i18n)`security`, t(i18n)`pin`, t(i18n)`lock`]
}));
