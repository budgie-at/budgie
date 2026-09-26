import { isDefined } from '@rnw-community/shared';

import type { ReactNode } from 'react';

interface Props {
    readonly slot: number;
    readonly count?: number;
    readonly title: ReactNode;
    readonly meta: ReactNode;
    readonly amount: string;
    readonly icon?: ReactNode;
    readonly children: ReactNode;
}

export const CategorizeDemoCard = ({ slot, count, title, meta, amount, icon, children }: Props) => (
    <div className="cdemo-card" data-count={count} data-slot={slot}>
        <div className="cdemo-card-top">
            {isDefined(icon) ? <span className="cdemo-card-icon">{icon}</span> : null}
            <span className="cdemo-card-heading">
                <span className="cdemo-card-title block">{title}</span>
                <span className="cdemo-card-meta block">{meta}</span>
            </span>
            <span className="cdemo-amount">{amount}</span>
        </div>
        <div className="cdemo-chips">{children}</div>
    </div>
);
