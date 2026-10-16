import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const FeatureVersusItem = ({ children }: Props) => <li className="feature-versus-item">{children}</li>;
