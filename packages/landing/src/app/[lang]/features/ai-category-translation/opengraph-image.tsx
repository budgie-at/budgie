/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'AI Category & Tag Translation — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('ai-category-translation', i18n => ({
    title: t(i18n)`Category & Tag Translation`,
    tagline: t(i18n)`Cyrillic to English. On-device.`,
    tags: [t(i18n)`translation`, t(i18n)`ai`, t(i18n)`multilingual`]
}));
