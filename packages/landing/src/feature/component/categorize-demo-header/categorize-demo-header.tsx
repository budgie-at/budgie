import type { ReactNode } from 'react';

interface Props {
    readonly title: ReactNode;
    readonly children: ReactNode;
}

export const CategorizeDemoHeader = ({ title, children }: Props) => (
    <div className="cdemo-header">
        <p className="cdemo-title">{title}</p>
        <p className="cdemo-subtitle">{children}</p>
        <div className="cdemo-progress">
            <span className="cdemo-progress-bar" data-cdemo-progress />
        </div>
    </div>
);
