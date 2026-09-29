import { getI18nInstance } from '../../i18n/app-router-i18n';

import { buildBlogArticleMetadata } from './build-blog-article-metadata.util';

import type { PageLangParam } from '../../i18n/init-lingui';
import type { ArticleRegistryEntryInterface } from '../interface/article-registry-entry.interface';
import type { Metadata } from 'next';

export const createBlogGenerateMetadata =
    (article: ArticleRegistryEntryInterface) =>
    async (props: PageLangParam): Promise<Metadata> => {
        const { lang } = await props.params;
        const i18n = getI18nInstance(lang);

        return buildBlogArticleMetadata({
            author: article.author,
            date: article.date,
            description: i18n._(article.seoDescription),
            keywords: article.seoKeywords.join(', '),
            locale: lang,
            slug: article.slug,
            title: i18n._(article.title)
        });
    };
