import type { ReactNode } from 'react';

interface Props {
    readonly id: string;
    readonly heading: ReactNode;
    readonly lede?: ReactNode;
    readonly children: ReactNode;
}

export const FeatureSplitSection = ({ id, heading, lede, children }: Props) => (
    <section aria-labelledby={`${id}-heading`} className="feature-section" id={id}>
        <div className="feature-wrap feature-split container px-4 md:px-6">
            <div className="feature-section-head">
                <h2 className="feature-section-title" id={`${id}-heading`}>
                    {heading}
                </h2>
                {lede}
            </div>
            <div className="feature-drawer">{children}</div>
        </div>
    </section>
);
