import type { ReactNode } from 'react';

interface Props {
    readonly value: ReactNode;
    readonly title: ReactNode;
    readonly children: ReactNode;
}

export const FeatureSpecTile = ({ value, title, children }: Props) => (
    <div className="feature-tile">
        <span className="feature-tile-value">{value}</span>
        <p className="feature-tile-label">
            <strong className="feature-tile-title">{title}</strong>
            {children}
        </p>
    </div>
);
