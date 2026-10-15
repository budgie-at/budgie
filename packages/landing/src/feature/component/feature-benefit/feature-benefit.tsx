import type { ReactNode } from 'react';
import type { IconComponent } from 'reicon-react';

interface Props {
    readonly icon: IconComponent;
    readonly title: ReactNode;
    readonly children: ReactNode;
}

export const FeatureBenefit = ({ icon: Icon, title, children }: Props) => (
    <div className="feature-benefit">
        <Icon aria-hidden className="feature-benefit-icon" />
        <h3 className="feature-benefit-title">{title}</h3>
        <p className="feature-benefit-body">{children}</p>
    </div>
);
