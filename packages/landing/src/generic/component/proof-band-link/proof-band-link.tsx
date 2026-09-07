import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import type { ReactNode } from 'react';

interface Props {
    readonly href: string;
    readonly children: ReactNode;
}

export const ProofBandLink = ({ href, children }: Props) => (
    <Link className="inline-flex items-center gap-1.5 accent-link text-sm font-medium underline-offset-4 hover:underline" href={href}>
        {children}
        <ArrowUpRight aria-hidden="true" className="size-4" />
    </Link>
);
