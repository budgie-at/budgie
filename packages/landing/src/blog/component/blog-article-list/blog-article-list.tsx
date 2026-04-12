import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    ordered?: boolean;
    columns?: 1 | 2;
}

export const BlogArticleList = ({ children, ordered = false, columns = 1 }: Props) => {
    const className = columns === 2 ? 'grid gap-3 sm:grid-cols-2' : 'space-y-3';
    const Tag = ordered ? 'ol' : 'ul';

    return <Tag className={className}>{children}</Tag>;
};
