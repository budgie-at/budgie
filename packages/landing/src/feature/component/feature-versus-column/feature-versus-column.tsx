import type { ReactNode } from 'react';

interface Props {
    readonly className: string;
    readonly title: ReactNode;
    readonly children: ReactNode;
}

export const FeatureVersusColumn = ({ className, title, children }: Props) => (
    <div className={`feature-versus-column ${className}`}>
        <h3 className="feature-versus-title">{title}</h3>
        <ul className="feature-versus-list">{children}</ul>
    </div>
);
