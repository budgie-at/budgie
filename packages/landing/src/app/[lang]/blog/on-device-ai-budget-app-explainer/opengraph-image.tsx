/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { createBlogOgRoute } from '../../../../blog/util/create-blog-og-route.util';

export const alt = 'On-Device AI in Your Budget App: How It Works and Why It Matters';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default createBlogOgRoute('ai-category-translation', i18n => ({
    title: t(i18n)`On-Device AI in Your Budget App: How It Works and Why It Matters`,
    tags: [t(i18n)`on-device-ai`, t(i18n)`privacy`, t(i18n)`local-llm`]
}));
