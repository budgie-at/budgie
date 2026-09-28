import type { ReactNode } from 'react';

interface Props {
    readonly slot: number;
    readonly summary: string;
    readonly children: ReactNode;
}

export const CategorizeDemoSectionLabel = ({ slot, summary, children }: Props) => (
    <p className="cdemo-label" data-slot={slot}>
        <span>{children}</span>
        <span>{summary}</span>
    </p>
);
