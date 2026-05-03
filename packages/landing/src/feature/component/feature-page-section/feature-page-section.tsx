import type { ReactNode } from 'react';

interface Props {
    readonly id?: string;
    readonly children: ReactNode;
}

export const FeaturePageSection = ({ id, children }: Props) => (
    <section className="w-full py-12 md:py-16" id={id}>
        <div className="container px-4 md:px-6 max-w-4xl space-y-6">{children}</div>
    </section>
);
