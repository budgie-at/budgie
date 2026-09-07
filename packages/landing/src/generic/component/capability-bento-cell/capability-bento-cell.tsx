import Link from 'next/link';

import { CapabilityBentoShot } from '../capability-bento-shot/capability-bento-shot';

import type { ReactNode } from 'react';

interface Props {
    readonly href: string;
    readonly title: ReactNode;
    readonly slug: string;
    readonly scene: string;
    readonly locale: string;
    readonly alt: string;
    readonly children: ReactNode;
}

export const CapabilityBentoCell = ({ href, title, slug, scene, locale, alt, children }: Props) => (
    <Link className="bento-cell" href={href}>
        <div className="bento-cell-copy">
            <h3 className="bento-cell-title">{title}</h3>
            <p className="bento-cell-body">{children}</p>
        </div>
        <CapabilityBentoShot
            alt={alt}
            className="bento-shot-small"
            locale={locale}
            scene={scene}
            sizes="(min-width: 1024px) 9rem, 42vw"
            slug={slug}
        />
    </Link>
);
