import { BlogCover } from '../../../generic/component/blog-cover/blog-cover';
import { Motion } from '../../../generic/component/motion/motion';

import type { ArticleRegistryEntryInterface } from '../../interface/article-registry-entry.interface';
import type { ReactNode } from 'react';

interface Props {
    article: Pick<ArticleRegistryEntryInterface, 'slug' | 'tags'>;
    children: ReactNode;
}

export const BlogArticleHero = ({ article, children }: Props) => (
    <article className="w-full py-20 md:py-32">
        <div className="container px-4 md:px-6 max-w-4xl">
            <Motion>{children}</Motion>

            <div className="aspect-21/9 overflow-hidden rounded-xl border mt-10">
                <BlogCover slug={article.slug} tags={article.tags} />
            </div>
        </div>
    </article>
);
