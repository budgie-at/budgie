import { FeatureVersusColumn } from '../feature-versus-column/feature-versus-column';

import type { ReactNode } from 'react';

interface Props {
    readonly title: ReactNode;
    readonly children: ReactNode;
}

export const FeatureVersusWithout = ({ title, children }: Props) => (
    <FeatureVersusColumn className="feature-versus-without" title={title}>
        {children}
    </FeatureVersusColumn>
);
