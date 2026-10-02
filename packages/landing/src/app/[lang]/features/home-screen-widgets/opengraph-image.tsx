/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Home Screen Widgets — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('net-worth-tracker', i18n => ({
    title: t(i18n)`Home Screen Widgets`,
    tagline: t(i18n)`Net worth, budget, and quick add on your iPhone Home Screen.`,
    tags: [t(i18n)`widgets`, t(i18n)`home screen`, t(i18n)`quick add`]
}));
