import { type ReactNode } from 'react';

import Link from 'next/link';

interface Props {
    href: string;
    position: number;
    children: ReactNode;
}

export const BlogBreadcrumbLink = ({ href, position, children }: Props) => (
    <>
        <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link className="hover:text-foreground transition-colors" href={href} itemProp="item">
                <span itemProp="name">{children}</span>
            </Link>
            <meta content={String(position)} itemProp="position" />
        </span>
        <span aria-hidden="true">/</span>
    </>
);
