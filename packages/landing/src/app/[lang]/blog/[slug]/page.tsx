/* eslint-disable react/jsx-max-depth */
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Calendar, Clock, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { isDefined } from '@rnw-community/shared';

import { BlogDataInterface } from '../../../../blog/interface/blog-data.interface';
import { calculateReadingTime } from '../../../../blog/util/calculate-reading-time.util';
import { getArticles } from '../../../../blog/util/get-articles.util';
import { JsonLd } from '../../../../generic/component/json-ld/json-ld';
import { Motion } from '../../../../generic/component/motion/motion';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { Badge } from '../../../../ui/badge';
import { Button } from '../../../../ui/button';

import type { Metadata } from 'next';

interface Props extends PageLangParam {
    params: Promise<{ lang: string; slug: string }>;
}

// eslint-disable-next-line func-style
export async function generateStaticParams() {
    const articles = getArticles();

    return articles.map(article => ({ slug: article.slug }));
}

const getPost = async (slug: string, lang: string): Promise<BlogDataInterface> =>
    (await import(`../../../../blog/content/${slug}/content.${lang}.mdx`)) as BlogDataInterface;

// eslint-disable-next-line func-style
export async function generateMetadata(props: Props): Promise<Metadata> {
    const { slug, lang } = await props.params;

    const i18n = initLingui(lang);

    const { metadata } = await getPost(slug, lang);

    if (!isDefined(metadata)) {
        return { title: i18n._(msg`Article Not Found`) };
    }

    return {
        title: metadata.title,
        description: metadata.seo.metaDescription,
        keywords: metadata.seo.keywords.join(', '),
        authors: [{ name: metadata.author }],
        alternates: {
            canonical: `https://budgie.app/${lang}/blog/${slug}`,
            languages: {
                en: `https://budgie.app/en/blog/${slug}`,
                uk: `https://budgie.app/uk/blog/${slug}`,
                fr: `https://budgie.app/fr/blog/${slug}`,
                de: `https://budgie.app/de/blog/${slug}`,
                es: `https://budgie.app/es/blog/${slug}`,
                'x-default': `https://budgie.app/en/blog/${slug}`
            }
        },
        openGraph: {
            title: metadata.title,
            description: metadata.seo.metaDescription,
            type: 'article',
            publishedTime: metadata.date,
            authors: [metadata.author],
            tags: metadata.tags,
            images: metadata.image ? [{ url: metadata.image }] : [],
            locale: lang
        },
        twitter: {
            card: 'summary_large_image',
            title: metadata.title,
            description: metadata.seo.metaDescription,
            images: metadata.image ? [metadata.image] : []
        }
    };
}

// eslint-disable-next-line max-lines-per-function
export default async function BlogArticlePage(props: Props) {
    const { slug, lang } = await props.params;

    initLingui(lang);

    const { default: Post, metadata } = await getPost(slug, lang).catch(() => {
        notFound();
    });

    if (!isDefined(metadata)) {
        notFound();
    }

    const formattedDate = new Date(metadata.date).toLocaleDateString(lang, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const readingTime = calculateReadingTime(Post.toString());

    /* eslint-disable lingui/no-unlocalized-strings */
    const blogPostingSchema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: metadata.title,
        description: metadata.description,
        datePublished: metadata.date,
        dateModified: metadata.date,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://budgie.app/${lang}/blog/${slug}`
        },
        author: {
            '@type': 'Person',
            name: metadata.author
        },
        publisher: {
            '@type': 'Organization',
            name: 'Budgie',
            logo: {
                '@type': 'ImageObject',
                url: 'https://budgie.app/logo/black-on-white.svg'
            }
        },
        image: metadata.image ?? '',
        keywords: metadata.tags.join(', ')
    };

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `https://budgie.app/${lang}`
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Blog',
                item: `https://budgie.app/${lang}/blog`
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: metadata.title,
                item: `https://budgie.app/${lang}/blog/${slug}`
            }
        ]
    };
    /* eslint-enable lingui/no-unlocalized-strings */

    return (
        <main className="flex-1">
            <JsonLd data={blogPostingSchema} />
            <JsonLd data={breadcrumbSchema} />
            <article className="w-full py-20 md:py-32">
                <div className="container px-4 md:px-6 max-w-4xl">
                    <Motion>
                        <Link
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                            href={`/${lang}/blog`}
                        >
                            <Trans>← Back to Blog</Trans>
                        </Link>

                        <div className="mb-8">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {metadata.tags.map(tag => (
                                    <Badge key={tag} variant="secondary">
                                        <Tag className="size-3 mr-1" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">{metadata.title}</h1>

                            <p className="text-lg md:text-xl text-muted-foreground mb-6">{metadata.description}</p>

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
                                        <Trans>By</Trans> {metadata.author}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {metadata.image && (
                            <div className="relative w-full h-[400px] mb-12 rounded-xl overflow-hidden">
                                <Image
                                    alt={metadata.title}
                                    className="object-cover"
                                    fill
                                    priority
                                    sizes="(max-width: 768px) 100vw, 896px"
                                    src={metadata.image}
                                />
                            </div>
                        )}
                    </Motion>

                    <Motion>
                        <div className="prose prose-lg dark:prose-invert max-w-none">
                            <Post />
                        </div>
                    </Motion>

                    <Motion className="mt-12 pt-8 border-t" index={1}>
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
    );
}
