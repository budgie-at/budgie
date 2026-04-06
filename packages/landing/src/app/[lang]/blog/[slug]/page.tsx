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
import { BASE_URL, OG_LOCALE_MAP } from '../../../../generic/constant/seo.constant';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { Badge } from '../../../../ui/badge';
import { Button } from '../../../../ui/button';

import type { Metadata } from 'next';

interface Props extends PageLangParam {
    params: Promise<{ lang: string; slug: string }>;
}

// eslint-disable-next-line func-style
export async function generateStaticParams() {
    const articles = await getArticles('en');

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
        title: `${metadata.title} | ${i18n._(msg`Budgie Blog`)}`,
        description: metadata.seo.metaDescription,
        keywords: metadata.seo.keywords.join(', '),
        authors: [{ name: metadata.author }],
        alternates: {
            canonical: `${BASE_URL}/${lang}/blog/${slug}`,
            languages: {
                en: `${BASE_URL}/en/blog/${slug}`,
                uk: `${BASE_URL}/uk/blog/${slug}`,
                fr: `${BASE_URL}/fr/blog/${slug}`,
                de: `${BASE_URL}/de/blog/${slug}`,
                es: `${BASE_URL}/es/blog/${slug}`
            }
        },
        openGraph: {
            title: metadata.title,
            description: metadata.seo.metaDescription,
            type: 'article',
            url: `${BASE_URL}/${lang}/blog/${slug}`,
            locale: OG_LOCALE_MAP[lang] ?? 'en_US',
            publishedTime: metadata.date,
            authors: [metadata.author],
            tags: metadata.tags,
            images: metadata.image ? [{ url: `${BASE_URL}${metadata.image}`, width: 1280, height: 720 }] : []
        },
        twitter: {
            card: 'summary_large_image',
            title: metadata.title,
            description: metadata.seo.metaDescription,
            images: metadata.image ? [`${BASE_URL}${metadata.image}`] : []
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
    const blogPostingData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: metadata.title,
        description: metadata.seo.metaDescription,
        ...(isDefined(metadata.image) && { image: `${BASE_URL}${metadata.image}` }),
        datePublished: metadata.date,
        author: { '@type': 'Person', name: metadata.author },
        publisher: { '@type': 'Organization', name: 'Budgie', url: BASE_URL },
        url: `${BASE_URL}/${lang}/blog/${slug}`,
        keywords: metadata.seo.keywords.join(', ')
    };

    const breadcrumbData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/${lang}` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/${lang}/blog` },
            { '@type': 'ListItem', position: 3, name: metadata.title }
        ]
    };
    /* eslint-enable lingui/no-unlocalized-strings */

    return (
        <main className="flex-1">
            <JsonLd data={blogPostingData} />
            <JsonLd data={breadcrumbData} />

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
