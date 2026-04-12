import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const BlogArticleSection = ({ children }: Props) => (
    <section className="space-y-4">{children}</section>
);
