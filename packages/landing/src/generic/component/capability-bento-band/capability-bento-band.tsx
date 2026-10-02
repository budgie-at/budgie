import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import type { ReactNode } from 'react';

interface Props {
    readonly href: string;
    readonly title: ReactNode;
    readonly children: ReactNode;
}

export const CapabilityBentoBand = ({ href, title, children }: Props) => (
    <Link className="bento-cell bento-band" href={href}>
        <div className="bento-cell-copy">
            <h3 className="bento-cell-title">{title}</h3>
            <p className="bento-cell-body">{children}</p>
        </div>
        <span aria-hidden="true" className="bento-band-arrow">
            <ArrowRight className="size-5" />
        </span>
    </Link>
);
