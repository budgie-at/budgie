import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Search } from 'lucide-react';
import { Suspense } from 'react';

import { BlogSearch } from '../../../blog/component/blog-search/blog-search';
import { getArticles } from '../../../blog/util/get-articles.util';
import { BlogCard } from '../../../generic/component/blog-card/blog-card';
import { Motion } from '../../../generic/component/motion/motion';
import { BASE_URL, OG_LOCALE_MAP } from '../../../generic/constant/seo.constant';
import { buildAlternates } from '../../../generic/util/build-alternates.util';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

import type { Metadata } from 'next';

interface Props extends PageLangParam {
    searchParams: Promise<{ query?: string; page?: string }>;
}

// eslint-disable-next-line func-style
export async function generateMetadata(props: Props): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    const title = i18n._(msg`Blog & Insights | Budgie`);
    const description = i18n._(
        msg`Articles about financial privacy, security best practices, offline-first architecture, and tips for better expense tracking.`
    );

    return {
        title,
        description,
        alternates: buildAlternates(lang, '/blog'),
        openGraph: {
            title,
            description,
            type: 'website',
            url: `${BASE_URL}/${lang}/blog`,
            locale: OG_LOCALE_MAP[lang] ?? 'en_US'
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description
        }
    };
}

// eslint-disable-next-line max-lines-per-function
export default async function BlogPage(props: Props) {
    const { lang } = await props.params;
    const { query = '', page = '1' } = await props.searchParams;

    initLingui(lang);

    const allArticles = await getArticles(lang);
    const searchQuery = query.toLowerCase() || '';
    const currentPage = Number.parseInt(page, 10);
    const articlesPerPage = 9;

    const filteredArticles = searchQuery
        ? allArticles.filter(
              article =>
                  article.title.toLowerCase().includes(searchQuery) ||
                  article.description.toLowerCase().includes(searchQuery) ||
                  article.tags.some(tag => tag.toLowerCase().includes(searchQuery))
          )
        : allArticles;

    const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
    const startIndex = (currentPage - 1) * articlesPerPage;
    const paginatedArticles = filteredArticles.slice(startIndex, startIndex + articlesPerPage);

    return (
        <main className="flex-1">
            <section className="w-full py-20 md:py-32 overflow-hidden">
                <div className="container px-4 md:px-6">
                    <Motion className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                            <Trans>Blog & Insights</Trans>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                            <Trans>
                                Stay informed about financial privacy, security best practices, and the latest features in Budgie.
                            </Trans>
                        </p>

                        <Suspense fallback={<div className="h-12" />}>
                            <BlogSearch currentPage={currentPage} locale={lang} searchQuery={searchQuery} />
                        </Suspense>
                    </Motion>

                    {paginatedArticles.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                                {paginatedArticles.map((article, index) => (
                                    <BlogCard
                                        key={article.slug}
                                        date={article.date}
                                        description={article.description}
                                        image={article.image}
                                        index={index}
                                        locale={lang}
                                        slug={article.slug}
                                        tags={article.tags}
                                        title={article.title}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <Motion className="flex justify-center gap-2 mt-8">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                        const isActive = page === currentPage;
                                        const params = new URLSearchParams();

                                        if (searchQuery) {
                                            params.set('q', searchQuery);
                                        }
                                        params.set('page', page.toString());

                                        return (
                                            <a
                                                key={page}
                                                className={`px-4 py-2 rounded-md transition-colors ${
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted hover:bg-muted/80 text-foreground'
                                                }`}
                                                href={`/${lang}/blog?${params.toString()}`}
                                            >
                                                {page}
                                            </a>
                                        );
                                    })}
                                </Motion>
                            )}
                        </>
                    ) : (
                        <Motion className="text-center py-12">
                            <Search className="size-16 mx-auto mb-4 text-muted-foreground" />

                            <h3 className="text-2xl font-bold mb-2">
                                <Trans>No articles found</Trans>
                            </h3>

                            <p className="text-muted-foreground">
                                <Trans>Try adjusting your search query or browse all articles.</Trans>
                            </p>
                        </Motion>
                    )}
                </div>
            </section>
        </main>
    );
}
