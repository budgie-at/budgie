import type { ReactNode } from 'react';

interface Props {
    readonly title: ReactNode;
    readonly total: number;
    readonly children: ReactNode;
}

export const CategorizeDemoHeader = ({ title, total, children }: Props) => (
    <div className="cdemo-header">
        <p className="cdemo-title">{title}</p>
        <p className="cdemo-subtitle">
            <span data-cdemo-count data-total={total}>
                {total}
            </span>{' '}
            {children}
        </p>
        <div className="cdemo-progress">
            <span className="cdemo-progress-bar" data-cdemo-progress />
        </div>
    </div>
);
