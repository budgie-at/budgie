import type { ReactNode } from 'react';

interface Props {
    readonly id?: string;
    readonly children: ReactNode;
}

export const FeaturePageSection = ({ id, children }: Props) => (
    <section className="w-full py-12 md:py-16" id={id}>
        <div className="container">
            <div className="max-w-4xl space-y-6">{children}</div>
        </div>
    </section>
);
