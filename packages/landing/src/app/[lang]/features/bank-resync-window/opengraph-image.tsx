/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Windowed Bank Re-sync — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('bank-resync-window', i18n => ({
    title: t(i18n)`Re-sync Window`,
    tagline: t(i18n)`Re-pull a slice. Keep your edits.`,
    tags: [t(i18n)`bank sync`, t(i18n)`re-sync`, t(i18n)`edits`]
}));
