/* eslint-disable max-lines-per-function */
/* eslint-disable lingui/no-unlocalized-strings */
/* eslint-disable @rnw-community/no-complex-jsx-logic */
/* eslint-disable react/jsx-max-depth */
/* eslint-disable no-undefined */

import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Calendar, Clock, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Footer } from '../../../../components/footer/footer';
import { Header } from '../../../../components/header/header';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { calculateReadingTime } from '../../../../lib/blog-utils';
import { getAllArticles, getArticleBySlug } from '../../../../lib/mdx-articles';
import { Motion } from '../../../../lib/motion';

import { BlogArticleContent } from './blog-article-content';

import type { Metadata } from 'next';


interface BlogArticlePageProps extends PageLangParam {
    params: Promise<{ lang: string; slug: string }>;
}

const initialMotion = { opacity: 0, y: 20 };
const transitionMotion = { duration: 0.5 };

// eslint-disable-next-line func-style
export async function generateStaticParams() {
    const articles = getAllArticles();

    return articles.map(article => ({
        slug: article.slug
    }));
}

// eslint-disable-next-line func-style
export async function generateMetadata(props: BlogArticlePageProps): Promise<Metadata> {
    const { slug, lang } = await props.params;
    const article = getArticleBySlug(slug, lang);

    if (!article) {
        return {
            title: 'Article Not Found'
        };
    }

    const i18n = getI18nInstance(lang);

    return {
        title: `${article.title} | ${i18n._(msg`Budgie Blog`)}`,
        description: article.seo.metaDescription,
        keywords: article.seo.keywords.join(', '),
        authors: [{ name: article.author }],
        openGraph: {
            title: article.title,
            description: article.seo.metaDescription,
            type: 'article',
            publishedTime: article.date,
            authors: [article.author],
            tags: article.tags,
            images: article.image ? [{ url: article.image }] : undefined
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: article.seo.metaDescription,
            images: article.image ? [article.image] : undefined
        }
    };
}

export default async function BlogArticlePage(props: BlogArticlePageProps) {
    const { slug, lang } = await props.params;

    initLingui(lang);

    const article = getArticleBySlug(slug, lang);

    if (!article) {
        notFound();
    }

    const formattedDate = new Date(article.date).toLocaleDateString(lang, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const {content} = article;
    const readingTime = calculateReadingTime(content);

    return (
        <div className="flex min-h-dvh flex-col">
            <Header />

            <main className="flex-1">
                <article className="w-full py-20 md:py-32">
                    <div className="container px-4 md:px-6 max-w-4xl">
                        <Motion animate={{ opacity: 1, y: 0 }} initial={initialMotion} transition={transitionMotion}>
                            <Link
                                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                                href={`/${lang}/blog`}
                            >
                                <Trans>← Back to Blog</Trans>
                            </Link>

                            <div className="mb-8">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {article.tags.map(tag => (
                                        <Badge key={tag} variant="secondary">
                                            <Tag className="size-3 mr-1" />
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>

                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">{article.title}</h1>

                                <p className="text-lg md:text-xl text-muted-foreground mb-6">{article.description}</p>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-6 border-b">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="size-4" />

                                        <span>{formattedDate}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Clock className="size-4" />

                                        <span>
                                            {readingTime} <Trans>min read</Trans>
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span>
                                            <Trans>By</Trans> {article.author}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {article.image && (
                                <div className="relative w-full h-[400px] mb-12 rounded-xl overflow-hidden">
                                    <Image
                                        alt={article.title}
                                        className="object-cover"
                                        fill
                                        priority
                                        sizes="(max-width: 768px) 100vw, 896px"
                                        src={article.image}
                                    />
                                </div>
                            )}
                        </Motion>

                        <BlogArticleContent content={content} />

                        <Motion
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-12 pt-8 border-t"
                            initial={initialMotion}
                            transition={{ ...transitionMotion, delay: 0.2 }}
                        >
                            <div className="bg-muted/50 rounded-xl p-8 text-center">
                                <h3 className="text-2xl font-bold mb-4">
                                    <Trans>Ready to Take Control of Your Financial Privacy?</Trans>
                                </h3>

                                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                                    <Trans>
                                        Join the Budgie waitlist and be among the first to experience truly private financial management.
                                    </Trans>
                                </p>

                                <Link href={`/${lang}#whitelist`}>
                                    <Button className="rounded-full h-12 px-8" size="lg">
                                        <Trans>Join Whitelist</Trans>
                                    </Button>
                                </Link>
                            </div>
                        </Motion>
                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
}
