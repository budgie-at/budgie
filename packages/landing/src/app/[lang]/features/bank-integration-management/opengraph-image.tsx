/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgRoute } from '../../../../feature/util/create-feature-og-route.util';

export const alt = 'Bank Connection Management — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createFeatureOgRoute('bank-integration-management', i18n => ({
    title: t(i18n)`Bank Connections — One Credential, Many Accounts`,
    tagline: t(i18n)`Cards, jars, and deposits share a single connection, so a token change is a one-time job.`,
    tags: [t(i18n)`bank sync`, t(i18n)`accounts`, t(i18n)`credentials`]
}));
