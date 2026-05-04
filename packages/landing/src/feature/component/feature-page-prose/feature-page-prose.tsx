import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const FeaturePageProse = ({ children }: Props) => (
    <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{children}</p>
);
