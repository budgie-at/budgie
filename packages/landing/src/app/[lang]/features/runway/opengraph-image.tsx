/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Runway: How Long Your Money Lasts — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('runway', i18n => ({
    title: t(i18n)`Runway`,
    tagline: t(i18n)`How long your money lasts at today's pace.`,
    tags: [t(i18n)`runway`, t(i18n)`forecast`, t(i18n)`burn rate`]
}));
