import { cn } from 'cn';

import type { ReactNode } from 'react';

const PAYMENT_OPTIONS = [2, 3, 4, 6, 12];

interface Props {
    readonly heading: ReactNode;
    readonly total: string;
    readonly parts: string;
    readonly label: ReactNode;
    readonly fee: ReactNode;
    readonly selected: number;
}

export const InstallmentPreviewSheet = ({ heading, total, parts, label, fee, selected }: Props) => (
    <div className="ipv-card ipv-sheet hero-enter">
        <span className="block text-xs font-medium text-muted-foreground">{heading}</span>
        <span className="ipv-amount mt-1 block text-3xl font-bold tracking-tight">{total}</span>
        <span className="ipv-amount block text-sm text-muted-foreground">{parts}</span>
        <span className="mt-4 block text-xs font-medium text-muted-foreground">{label}</span>
        <span className="mt-2 flex gap-1.5">
            {PAYMENT_OPTIONS.map(option => (
                <span className={cn('ipv-chip', option === selected && 'ipv-chip-selected')} key={option}>
                    {option}
                </span>
            ))}
        </span>
        <span className="mt-4 block text-xs font-medium text-muted-foreground">{fee}</span>
    </div>
);
