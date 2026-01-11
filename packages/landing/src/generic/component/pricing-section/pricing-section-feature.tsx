import { Check } from 'lucide-react';

import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const PricingSectionFeature = ({ children }: Props) => (
    <li className="flex items-center gap-2 text-sm">
        <Check className="size-4 text-green-500 shrink-0" />

        <span>{children}</span>
    </li>
);
