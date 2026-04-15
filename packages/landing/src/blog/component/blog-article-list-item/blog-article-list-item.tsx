import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const BlogArticleListItem = ({ children }: Props) => (
    <li className="flex items-start gap-3">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

        <span className="text-muted-foreground">{children}</span>
    </li>
);
