import { ShoppingBag } from 'lucide-react';

import type { ReactNode } from 'react';

interface Props {
    readonly title: ReactNode;
    readonly category: ReactNode;
    readonly amount: string;
}

export const InstallmentPreviewPurchase = ({ title, category, amount }: Props) => (
    <div className="ipv-card ipv-purchase hero-enter">
        <span className="ipv-icon">
            <ShoppingBag size={16} />
        </span>
        <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{title}</span>
            <span className="block truncate text-xs text-muted-foreground">{category}</span>
        </span>
        <span className="ipv-amount text-sm font-semibold">{amount}</span>
    </div>
);
