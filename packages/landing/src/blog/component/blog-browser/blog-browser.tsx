'use client';

import { Trans } from '@lingui/react/macro';
import { Search } from 'lucide-react';
import { useState } from 'react';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { BlogCard } from '../../../generic/component/blog-card/blog-card';
import { Motion } from '../../../generic/component/motion/motion';
import { BlogPaginationButton } from '../blog-pagination-button/blog-pagination-button';
import { BlogSearch } from '../blog-search/blog-search';

import type { BlogBrowserArticleInterface } from '../../interface/blog-browser-article.interface';

interface Props {
    readonly articles: readonly BlogBrowserArticleInterface[];
    readonly locale: string;
}

const ARTICLES_PER_PAGE = 9;

export const BlogBrowser = ({ articles, locale }: Props) => {
    const [rawSearchQuery, setRawSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const searchQuery = rawSearchQuery.toLowerCase();
    const hasSearchQuery = isNotEmptyString(searchQuery);
    const filteredArticles = hasSearchQuery
        ? articles.filter(
              article =>
                  article.title.toLowerCase().includes(searchQuery) ||
                  article.description.toLowerCase().includes(searchQuery) ||
                  article.tags.some(tag => tag.toLowerCase().includes(searchQuery))
          )
        : articles;
    const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
    const visiblePage = Math.min(currentPage, Math.max(totalPages, 1));
    const startIndex = (visiblePage - 1) * ARTICLES_PER_PAGE;
    const paginatedArticles = filteredArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);
    const handleSearch = (value: string) => {
        setRawSearchQuery(value);
        setCurrentPage(1);
    };

    return (
        <>
            <BlogSearch onSearch={handleSearch} searchQuery={rawSearchQuery} />

            {isNotEmptyArray(paginatedArticles) ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        {paginatedArticles.map((article, index) => (
                            <BlogCard
                                key={article.slug}
                                date={article.date}
                                description={article.description}
                                image={article.image}
                                index={index}
                                locale={locale}
                                readingTimeMinutes={article.readingTimeMinutes}
                                slug={article.slug}
                                tags={article.tags}
                                title={article.title}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <Motion className="flex justify-center gap-2 mt-8">
                            {Array.from({ length: totalPages }, (_, pageIndex) => pageIndex + 1).map(page => (
                                <BlogPaginationButton key={page} currentPage={visiblePage} onPageChange={setCurrentPage} page={page} />
                            ))}
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
        </>
    );
};
