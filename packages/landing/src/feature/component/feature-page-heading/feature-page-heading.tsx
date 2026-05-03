import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly level?: 2 | 3;
}

export const FeaturePageHeading = ({ children, level = 2 }: Props) => {
    if (level === 3) {
        return <h3 className="text-xl md:text-2xl font-semibold tracking-tight mt-6">{children}</h3>;
    }

    return <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{children}</h2>;
};
