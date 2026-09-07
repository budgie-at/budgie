import { Trans } from '@lingui/react/macro';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ARTICLE_REGISTRY } from '../../../blog/constant/article-registry.constant';
import { resolveArticleShot } from '../../../blog/util/resolve-article-shot.util';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { Button } from '../../../ui/button';
import { BlogCard } from '../blog-card/blog-card';

const HOME_ARTICLE_COUNT = 3;

interface Props {
    readonly locale: string;
}

export const BlogSection = ({ locale }: Props) => {
    const i18n = getI18nInstance(locale);
    const recentArticles = ARTICLE_REGISTRY.map(entry => ({
        slug: entry.slug,
        title: i18n._(entry.title),
        description: i18n._(entry.description),
        date: entry.date,
        author: entry.author,
        tags: entry.tags,
        readingTimeMinutes: entry.readingTimeMinutes,
        shot: resolveArticleShot(entry.slug, entry.relatedFeatureSlugs, locale)
    }))
        .sort((article1, article2) => new Date(article2.date).getTime() - new Date(article1.date).getTime())
        .slice(0, HOME_ARTICLE_COUNT);

    return (
        <section className="w-full bg-muted/30 py-8 md:py-20">
            <div className="container px-4 md:px-6 max-w-7xl">
                <div className="max-w-2xl mb-8 md:mb-12">
                    <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-balance">
                        <Trans>Latest from Our Blog</Trans>
                    </h2>

                    <p className="mt-3 text-base md:text-lg text-muted-foreground text-pretty">
                        <Trans>
                            Discover insights about financial privacy, security best practices, and how to take control of your money.
                        </Trans>
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
                    {recentArticles.map(article => (
                        <BlogCard article={article} key={article.slug} locale={locale} />
                    ))}
                </div>

                <Link className="mt-8 inline-block" href={`/${locale}/blog`}>
                    <Button className="rounded-full h-12 px-8" size="lg" variant="outline">
                        <Trans>View All Articles</Trans>
                        <ArrowRight aria-hidden="true" className="ml-2 size-4" />
                    </Button>
                </Link>
            </div>
        </section>
    );
};
