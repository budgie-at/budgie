import type { ReactNode } from 'react';

interface Props {
    readonly slot: number;
    readonly count: number;
    readonly children: ReactNode;
}

export const CategorizeDemoSectionLabel = ({ slot, count, children }: Props) => (
    <p className="cdemo-label" data-slot={slot}>
        <span>{children}</span>
        <span>{count}</span>
    </p>
);
