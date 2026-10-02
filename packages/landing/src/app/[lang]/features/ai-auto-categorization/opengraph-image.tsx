/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'On-Device AI Auto-Categorization — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('ai-auto-categorization', i18n => ({
    title: t(i18n)`On-Device AI Categorization`,
    tagline: t(i18n)`Categorize without leaking — model runs on your phone.`,
    tags: [t(i18n)`ai`, t(i18n)`on-device`, t(i18n)`privacy`]
}));
