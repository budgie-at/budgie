import { Check } from 'lucide-react';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: ReactNode;
    readonly children: ReactNode;
}

export const CategorizeDemoSuggestion = ({ icon, children }: Props) => (
    <span className="cdemo-chip">
        {icon}
        {children}
        <Check className="cdemo-chip-check" size={12} strokeWidth={3} />
        <span className="cdemo-chip-lit">
            {icon}
            {children}
            <Check size={12} strokeWidth={3} />
        </span>
    </span>
);
