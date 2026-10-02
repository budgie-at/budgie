/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Custom Categories — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('custom-categories', i18n => ({
    title: t(i18n)`Custom Categories`,
    tagline: t(i18n)`Build a tree that fits your life.`,
    tags: [t(i18n)`categories`, t(i18n)`custom`, t(i18n)`organization`]
}));
