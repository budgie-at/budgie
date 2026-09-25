import { PartyPopper } from 'lucide-react';

import type { ReactNode } from 'react';

interface Props {
    readonly title: ReactNode;
    readonly children: ReactNode;
}

export const CategorizeDemoDone = ({ title, children }: Props) => (
    <div className="cdemo-done">
        <span className="cdemo-done-icon">
            <PartyPopper size={22} />
        </span>
        <p className="cdemo-done-title">{title}</p>
        <p className="cdemo-done-text">{children}</p>
    </div>
);
