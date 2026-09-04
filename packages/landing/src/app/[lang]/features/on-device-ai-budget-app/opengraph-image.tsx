/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createFeatureOgImage } from '../../../../feature/component/feature-og-image/feature-og-image';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'On-Device AI Budget App — Private LLM Categorization — Budgie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    return createFeatureOgImage(
        t(i18n)`On-Device AI Budget App — Local LLM, No Cloud Inference`,
        t(i18n)`Cloud AI assistants for budgeting send every transaction to a remote server for "intelligence". Budgie runs the LLM and embeddings on your phone — your data never leaves.`,
        [t(i18n)`ai`, t(i18n)`on-device`, t(i18n)`privacy`]
    );
};

export default OgImage;
