import { t } from '@lingui/core/macro';

import { FeaturePageRelated } from '../../../feature/component/feature-page-related/feature-page-related';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { BlogArticleCta } from '../blog-article-cta/blog-article-cta';
import { BlogPostingJsonLd } from '../blog-posting-json-ld/blog-posting-json-ld';
import { RelatedArticles } from '../related-articles/related-articles';

import type { ArticleRegistryEntryInterface } from '../../interface/article-registry-entry.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly article: ArticleRegistryEntryInterface;
    readonly children: ReactNode;
    readonly lang: string;
}

export const BlogArticlePageShell = ({ article, children, lang }: Props) => {
    const i18n = getI18nInstance(lang);

    return (
        <main className="flex-1">
            <BlogPostingJsonLd
                author={article.author}
                blogLabel={t(i18n)`Blog`}
                date={article.date}
                description={i18n._(article.description)}
                homeLabel={t(i18n)`Home`}
                image={`/${lang}/blog/${article.slug}/opengraph-image`}
                keywords={article.seoKeywords.join(', ')}
                locale={lang}
                slug={article.slug}
                title={i18n._(article.title)}
            />

            {children}

            <RelatedArticles locale={lang} slugs={article.relatedArticleSlugs} />

            <FeaturePageRelated locale={lang} slugs={article.relatedFeatureSlugs} />

            <BlogArticleCta locale={lang} />
        </main>
    );
};
