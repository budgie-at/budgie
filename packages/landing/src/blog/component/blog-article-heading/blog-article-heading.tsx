import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const BlogArticleHeading = ({ children }: Props) => (
    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{children}</h2>
);
