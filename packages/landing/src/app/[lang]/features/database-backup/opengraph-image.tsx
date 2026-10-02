/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Database Backup & Restore — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('database-backup', i18n => ({
    title: t(i18n)`Backup & Restore`,
    tagline: t(i18n)`One file. Encrypted when you set a PIN. No account.`,
    tags: [t(i18n)`backup`, t(i18n)`restore`, t(i18n)`encryption`]
}));
