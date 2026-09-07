import { type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const BlogBreadcrumbs = ({ children }: Props) => (
    <nav
        aria-label="breadcrumb"
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mb-8"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
    >
        {children}
    </nav>
);
