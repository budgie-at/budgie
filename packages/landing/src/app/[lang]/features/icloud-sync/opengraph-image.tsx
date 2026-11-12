/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/utils/create-feature-og-route.util';

export const alt = 'iCloud Sync and Backup — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('icloud-sync', i18n => ({
    title: t(i18n)`iCloud Sync and Backup`,
    tagline: t(i18n)`Your devices in sync. No Budgie server.`,
    tags: [t(i18n)`iCloud`, t(i18n)`sync`, t(i18n)`backup`]
}));
