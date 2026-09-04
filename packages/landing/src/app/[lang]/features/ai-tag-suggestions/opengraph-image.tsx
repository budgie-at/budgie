/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Automatic Expense Tags — On-Device — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`Automatic Tag Suggestions — Tap, Don't Type`,
        t(i18n)`After picking a category, the on-device LLM proposes up to three tags as tappable pills. Embedding-first fallback when the LLM is busy.`,
        [t(i18n)`ai`, t(i18n)`tags`, t(i18n)`suggestions`]
    );
};

export default OgImage;
