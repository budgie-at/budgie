import { buildPageMetadata } from '../../generic/util/build-page-metadata.util';
import { getI18nInstance } from '../../i18n/app-router-i18n';

import type { PageLangParam } from '../../i18n/init-lingui';
import type { ArticleRegistryEntryInterface } from '../interface/article-registry-entry.interface';
import type { Metadata } from 'next';

export const createBlogGenerateMetadata =
    (article: ArticleRegistryEntryInterface) =>
    async (props: PageLangParam): Promise<Metadata> => {
        const { lang } = await props.params;
        const i18n = getI18nInstance(lang);

        return buildPageMetadata({
            author: article.author,
            description: i18n._(article.seoDescription),
            keywords: article.seoKeywords.join(', '),
            locale: lang,
            path: `/blog/${article.slug}`,
            publishedAt: article.date,
            title: i18n._(article.title)
        });
    };
