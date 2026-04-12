import { type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const BlogBreadcrumbs = ({ children }: Props) => (
    <nav
        aria-label="breadcrumb"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-8"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
    >
        {children}
    </nav>
);
