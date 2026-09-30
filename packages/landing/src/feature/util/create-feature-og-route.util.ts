import { resolveOgPlate } from '../../generic/util/resolve-og-plate.util';
import { getI18nInstance } from '../../i18n/app-router-i18n';
import { createFeatureOgImage } from '../component/feature-og-image/feature-og-image';

import type { PageLangParam } from '../../i18n/init-lingui';
import type { FeatureOgCopyInterface } from '../interface/feature-og-copy.interface';
import type { I18n } from '@lingui/core';

export const createFeatureOgRoute =
    (plateSlug: string, getCopy: (i18n: I18n) => FeatureOgCopyInterface) =>
    async ({ params }: PageLangParam) => {
        const { lang } = await params;
        const { title, tagline, tags } = getCopy(getI18nInstance(lang));

        return createFeatureOgImage(title, tagline, tags, resolveOgPlate(plateSlug, lang));
    };
