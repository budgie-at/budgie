import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const BlogArticleSubheading = ({ children }: Props) => (
    <h3 className="text-xl md:text-2xl font-semibold tracking-tight">{children}</h3>
);
