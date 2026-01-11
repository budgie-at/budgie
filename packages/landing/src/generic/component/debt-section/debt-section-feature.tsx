import { Check } from 'lucide-react';

import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const DebtSectionFeature = ({ children }: Props) => (
    <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check className="size-4 text-green-600" />
        </div>

        <span>{children}</span>
    </div>
);
