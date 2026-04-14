import { type ReactNode } from 'react';

interface Props {
    position: number;
    children: ReactNode;
}

export const BlogBreadcrumbCurrent = ({ position, children }: Props) => (
    <span aria-current="page" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
        <span className="text-foreground" itemProp="name">
            {children}
        </span>
        <meta content={String(position)} itemProp="position" />
    </span>
);
