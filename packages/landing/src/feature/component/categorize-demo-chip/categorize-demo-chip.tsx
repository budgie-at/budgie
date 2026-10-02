import type { ReactNode } from 'react';

interface Props {
    readonly icon: ReactNode;
    readonly children: ReactNode;
}

export const CategorizeDemoChip = ({ icon, children }: Props) => (
    <span className="cdemo-chip text-muted-foreground">
        {icon}
        {children}
    </span>
);
