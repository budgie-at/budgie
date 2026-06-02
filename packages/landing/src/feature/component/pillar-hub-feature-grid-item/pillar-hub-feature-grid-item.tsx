import Link from 'next/link';

import { Motion } from '../../../generic/component/motion/motion';

import type { ReactNode } from 'react';

interface Props {
    readonly href: string;
    readonly index: number;
    readonly title: ReactNode;
    readonly tagline: ReactNode;
}

export const PillarHubFeatureGridItem = ({ href, index, title, tagline }: Props) => (
    <Motion index={index}>
        <Link
            className="block h-full rounded-lg border border-border/60 bg-card p-5 transition-colors hover:border-emerald-500/60"
            href={href}
        >
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{tagline}</p>
        </Link>
    </Motion>
);
