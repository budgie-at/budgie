import { CheckCheck } from 'lucide-react';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const CategorizeDemoAccept = ({ children }: Props) => (
    <span className="cdemo-accept">
        <CheckCheck size={16} />
        {children}
    </span>
);
