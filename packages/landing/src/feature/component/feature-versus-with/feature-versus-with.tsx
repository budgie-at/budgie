import { FeatureVersusColumn } from '../feature-versus-column/feature-versus-column';

import type { ReactNode } from 'react';

interface Props {
    readonly title: ReactNode;
    readonly children: ReactNode;
}

export const FeatureVersusWith = ({ title, children }: Props) => (
    <FeatureVersusColumn className="feature-versus-with" title={title}>
        {children}
    </FeatureVersusColumn>
);
