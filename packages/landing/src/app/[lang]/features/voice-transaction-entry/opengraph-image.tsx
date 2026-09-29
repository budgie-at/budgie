/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Voice Transaction Entry — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('voice-transaction-entry', i18n => ({
    title: t(i18n)`Voice Transaction Entry`,
    tagline: t(i18n)`Speak it. Budgie logs it. Audio never leaves your phone.`,
    tags: [t(i18n)`voice`, t(i18n)`on-device`, t(i18n)`ai`]
}));
