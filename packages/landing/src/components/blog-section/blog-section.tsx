/* eslint-disable @rnw-community/no-complex-jsx-logic */

import { Trans } from '@lingui/react/macro';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { getRecentArticles } from '../../lib/mdx-articles';
import { Motion } from '../../lib/motion';
import { BlogCard } from '../blog-card/blog-card';
import { Button } from '../ui/button';

const initialMotion = { opacity: 0, y: 20 };
const transitionMotion = { duration: 0.5 };
const viewportMotion = { once: true };
const whileInViewMotion = { opacity: 1, y: 0 };

interface BlogSectionProps {
    locale: string;
}

export const BlogSection = ({ locale }: BlogSectionProps) => {
    const recentArticles = getRecentArticles(3);

    return (
        <section className="w-full py-20 md:py-32 bg-muted/30">
            <div className="container px-4 md:px-6">
                <Motion
                    className="text-center mb-12"
                    initial={initialMotion}
                    transition={transitionMotion}
                    viewport={viewportMotion}
                    whileInView={whileInViewMotion}
                >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                        <Trans>Latest from Our Blog</Trans>
                    </h2>

                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                        <Trans>
                            Discover insights about financial privacy, security best practices, and how to take control of your money.
                        </Trans>
                    </p>
                </Motion>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {recentArticles.map((article, index) => (
                        <BlogCard
                            key={article.slug}
                            date={article.date}
                            description={article.description}
                            image={article.image}
                            index={index}
                            locale={locale}
                            slug={article.slug}
                            tags={article.tags}
                            title={article.title}
                        />
                    ))}
                </div>

                <Motion
                    className="text-center"
                    initial={initialMotion}
                    transition={{ ...transitionMotion, delay: 0.3 }}
                    viewport={viewportMotion}
                    whileInView={whileInViewMotion}
                >
                    <Link href={`/${locale}/blog`}>
                        <Button className="rounded-full h-12 px-8" size="lg" variant="outline">
                            <Trans>View All Articles</Trans>
                            <ArrowRight className="ml-2 size-4" />
                        </Button>
                    </Link>
                </Motion>
            </div>
        </section>
    );
};
