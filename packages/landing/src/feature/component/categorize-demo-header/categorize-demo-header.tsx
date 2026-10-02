import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const CategorizeDemoHeader = ({ children }: Props) => (
    <div className="cdemo-header">
        <p className="cdemo-title">{children}</p>
    </div>
);
