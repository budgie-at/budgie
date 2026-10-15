import { Check } from 'reicon-react';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const FeatureBenefitsIncludedItem = ({ children }: Props) => (
    <li className="feature-included-item">
        <Check aria-hidden className="feature-included-check" />
        <span>{children}</span>
    </li>
);
