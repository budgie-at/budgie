import { CapabilityBentoAnchor } from '../capability-bento-anchor/capability-bento-anchor';
import { CapabilityBentoBand } from '../capability-bento-band/capability-bento-band';
import { CapabilityBentoCell } from '../capability-bento-cell/capability-bento-cell';

import type { ReactNode } from 'react';

interface Props {
    readonly heading: ReactNode;
    readonly lede: ReactNode;
    readonly children: ReactNode;
}

const CapabilityBentoRoot = ({ heading, lede, children }: Props) => (
    <section className="w-full py-16 md:py-24" id="features">
        <div className="container px-4 md:px-6 max-w-7xl">
            <div className="max-w-2xl">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-balance">{heading}</h2>
                <p className="mt-3 text-base md:text-lg text-muted-foreground text-pretty">{lede}</p>
            </div>

            <div className="bento-grid mt-8 md:mt-12">{children}</div>
        </div>
    </section>
);

export const CapabilityBento = Object.assign(CapabilityBentoRoot, {
    Anchor: CapabilityBentoAnchor,
    Band: CapabilityBentoBand,
    Cell: CapabilityBentoCell
});
