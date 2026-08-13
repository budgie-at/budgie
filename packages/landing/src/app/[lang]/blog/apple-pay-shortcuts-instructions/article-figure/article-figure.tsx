import Image from 'next/image';

import type { ReactNode } from 'react';

interface Props {
    readonly alt: string;
    readonly caption: ReactNode;
    readonly src: string;
}

export const ArticleFigure = ({ alt, caption, src }: Props) => (
    <figure className="not-prose overflow-hidden rounded-lg border border-border bg-card">
        <div className="relative aspect-[16/10] bg-muted">
            <Image alt={alt} className="object-contain" fill sizes="(min-width: 768px) 768px, 100vw" src={src} />
        </div>
        <figcaption className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">{caption}</figcaption>
    </figure>
);
