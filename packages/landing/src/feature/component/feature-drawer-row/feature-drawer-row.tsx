import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly marker: ReactNode;
    readonly summary: ReactNode;
    readonly children: ReactNode;
}

export const FeatureDrawerRow = ({ index, marker, summary, children }: Props) => (
    <details className="feature-drawer-row" open={index === 0}>
        <summary className="feature-drawer-summary">
            <span aria-hidden className="feature-drawer-marker">
                {marker}
            </span>
            <span>{summary}</span>
        </summary>
        <div className="feature-drawer-body">{children}</div>
    </details>
);
