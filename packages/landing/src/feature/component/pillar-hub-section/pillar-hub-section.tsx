import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const PillarHubSection = ({ children }: Props) => (
    <section className="w-full py-12 md:py-16">
        <div className="container space-y-6">{children}</div>
    </section>
);
