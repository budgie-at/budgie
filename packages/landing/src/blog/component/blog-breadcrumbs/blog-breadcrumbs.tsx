import { msg } from '@lingui/core/macro';
import { getI18n } from '@lingui/react/server';
import { type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const BlogBreadcrumbs = ({ children }: Props) => (
    <nav
        aria-label={getI18n()?._(msg`Breadcrumb`)}
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mb-8"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
    >
        {children}
    </nav>
);
