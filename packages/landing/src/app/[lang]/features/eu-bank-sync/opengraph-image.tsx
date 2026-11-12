/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/utils/create-feature-og-route.util';

export const alt = 'EU Bank Sync — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('eu-bank-sync', i18n => ({
    title: t(i18n)`EU Bank Sync`,
    tagline: t(i18n)`Your bank to your phone. No Budgie server.`,
    tags: [t(i18n)`N26`, t(i18n)`Trade Republic`, t(i18n)`private`]
}));
