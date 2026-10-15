import type { ReactNode } from 'react';
import type { IconComponent } from 'reicon-react';

interface Props {
    readonly icon: IconComponent;
    readonly children: ReactNode;
}

export const FeatureProofFact = ({ icon: Icon, children }: Props) => (
    <p className="feature-proof-fact">
        <Icon aria-hidden className="feature-proof-fact-icon" />
        <span>{children}</span>
    </p>
);
