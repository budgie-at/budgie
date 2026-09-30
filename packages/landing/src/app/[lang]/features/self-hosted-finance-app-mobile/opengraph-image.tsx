/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Self-Hosted Budget App Mobile — No Server Needed — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('self-hosted-finance-app-mobile', i18n => ({
    title: t(i18n)`Self-Hosted Finance App on Mobile — Without Running a Server`,
    tagline: t(
        i18n
    )`Self-hosting promises privacy but ships a server you have to babysit. Budgie gives you the same data ownership with zero ops — your phone is the server.`,
    tags: [t(i18n)`self-hosted`, t(i18n)`privacy`, t(i18n)`no-server`]
}));
