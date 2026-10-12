import { resolveOgPlate } from '../../generic/util/resolve-og-plate.util';
import { getI18nInstance } from '../../i18n/app-router-i18n';
import { createBlogOgImage } from '../component/blog-og-image/blog-og-image';

import type { PageLangParam } from '../../i18n/init-lingui';
import type { BlogOgCopyInterface } from '../interface/blog-og-copy.interface';
import type { I18n } from '@lingui/core';

export const createBlogOgRoute =
    (plateSlug: string, getCopy: (i18n: I18n) => BlogOgCopyInterface) =>
    async ({ params }: PageLangParam) => {
        const { lang } = await params;
        const { title, tags } = getCopy(getI18nInstance(lang));

        return createBlogOgImage(title, tags, resolveOgPlate(plateSlug, lang));
    };
