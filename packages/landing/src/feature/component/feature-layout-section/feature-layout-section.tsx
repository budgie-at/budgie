import type { ReactNode } from 'react';

interface Props {
    readonly heading: ReactNode;
    readonly lede?: ReactNode;
    readonly children: ReactNode;
}

export const FeatureLayoutSection = ({ heading, lede, children }: Props) => (
    <section className="feature-section">
        <div className="feature-wrap container px-4 md:px-6">
            <div className="feature-section-head">
                <h2 className="feature-section-title">{heading}</h2>
                {lede}
            </div>
            {children}
        </div>
    </section>
);
