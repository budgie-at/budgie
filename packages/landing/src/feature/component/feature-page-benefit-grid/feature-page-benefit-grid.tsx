import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const FeaturePageBenefitGrid = ({ children }: Props) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">{children}</div>
);
