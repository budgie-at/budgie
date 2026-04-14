import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const BlogArticleProse = ({ children }: Props) => <p className="text-lg leading-relaxed text-muted-foreground">{children}</p>;
