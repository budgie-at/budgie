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

export const CapabilityBentoAnchor = ({ href, title, slug, scene, locale, alt, children }: Props) => (
    <Link className="bento-cell bento-cell-anchor" href={href}>
        <div className="bento-cell-copy">
            <h3 className="bento-cell-title bento-cell-title-anchor">{title}</h3>
            <p className="bento-cell-body">{children}</p>
        </div>
        <CapabilityBentoShot
            alt={alt}
            className="bento-shot-anchor"
            locale={locale}
            scene={scene}
            sizes="(min-width: 1024px) 15rem, 52vw"
            slug={slug}
        />
    </Link>
);
