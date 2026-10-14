import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
    readonly icon: LucideIcon;
    readonly children: ReactNode;
}

export const FeatureProofFact = ({ icon: Icon, children }: Props) => (
    <p className="feature-proof-fact">
        <Icon aria-hidden className="feature-proof-fact-icon" />
        <span>{children}</span>
    </p>
);
