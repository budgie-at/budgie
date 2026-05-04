import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const FeaturePageHeading = ({ children }: Props) => <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{children}</h2>;
