import { Trans } from '@lingui/react/macro';
import { getI18n } from '@lingui/react/server';
import Link from 'next/link';

import { isDefined } from '@rnw-community/shared';

import { ARTICLE_REGISTRY } from '../../constant/article-registry.constant';

interface RelatedArticlesProps {
    readonly slugs: ReadonlyArray<string>;
    readonly locale: string;
}

export const RelatedArticles = ({ slugs, locale }: RelatedArticlesProps) => {
    const i18n = getI18n();

    const articles = slugs.map(slug => ARTICLE_REGISTRY.find(entry => entry.slug === slug)).filter(isDefined);

    if (!isDefined(i18n) || articles.length === 0) {
        return null;
    }

    return (
        <section className="w-full py-12 md:py-16 border-t">
            <div className="container px-4 md:px-6 max-w-4xl">
                <h2 className="text-2xl font-bold tracking-tight mb-8">
                    <Trans>Related Articles</Trans>
                </h2>

                <div className="grid gap-6 sm:grid-cols-2">
                    {articles.map(article => {
                        const title = i18n._(article.title);
                        const description = i18n._(article.description);
                        const articleUrl = `/${locale}/blog/${article.slug}`;

                        return (
                            <Link
                                key={article.slug}
                                href={articleUrl}
                                className="group block rounded-lg border bg-card p-6 hover:border-primary/50 hover:shadow-md transition-all duration-200"
                            >
                                <p className="text-xs text-muted-foreground mb-2">{article.date}</p>

                                <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                                    {title}
                                </h3>

                                <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>

                                <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                                    <Trans>Read article</Trans>
                                    <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
