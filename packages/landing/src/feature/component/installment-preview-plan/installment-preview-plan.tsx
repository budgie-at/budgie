import { CalendarClock } from 'lucide-react';

import type { ReactNode } from 'react';

interface Props {
    readonly eyebrow: ReactNode;
    readonly title: ReactNode;
    readonly next: string;
    readonly outstanding: string;
    readonly total: ReactNode;
    readonly paid: number;
    readonly count: number;
}

export const InstallmentPreviewPlan = ({ eyebrow, title, next, outstanding, total, paid, count }: Props) => (
    <div className="ipv-card ipv-plan hero-enter">
        <span className="block text-xs font-medium text-muted-foreground">{eyebrow}</span>
        <span className="mt-2 flex items-center gap-3">
            <span className="ipv-icon">
                <CalendarClock size={16} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{title}</span>
            </span>
            <span className="text-right">
                <span className="ipv-amount block text-sm font-semibold">{outstanding}</span>
                <span className="ipv-amount block text-xs text-muted-foreground">{total}</span>
            </span>
        </span>
        <span className="ipv-track">
            {Array.from({ length: count }, (_, index) => {
                const isPaid = index < paid;

                return <span className="ipv-segment" data-paid={isPaid} key={index} />;
            })}
        </span>
        <span className="ipv-amount mt-2 block text-xs font-medium text-muted-foreground">{next}</span>
    </div>
);
